import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import dayjs from 'dayjs';
import readingTime from 'reading-time';

const localizedFormat = require('dayjs/plugin/localizedFormat');

dayjs.extend(localizedFormat);

const databaseId = process.env.NOTION_DATABASE_ID ?? '';

const notion = new Client({
  auth: process.env.NOTION_KEY
});

let dataSourceIdPromise;

const getDataSourceId = async () => {
  if (!dataSourceIdPromise) {
    dataSourceIdPromise = notion.databases
      .retrieve({ database_id: databaseId })
      .then((database) => database.data_sources?.[0]?.id)
      .then((dataSourceId) => {
        if (!dataSourceId) {
          throw new Error(`No data source found for Notion database ${databaseId}`);
        }
        return dataSourceId;
      });
  }

  return dataSourceIdPromise;
};

export const getNotionDatabase = async () => {
  const response = await notion.databases.retrieve({
    database_id: databaseId
  });
  return response.data_sources;
};

const pageToPostTransformer = (page, isPrevNextPostIteration = false) => {
  let imgUrl = page.cover?.type === 'file' ? page.cover?.file.url : page.cover?.external?.url;
  imgUrl = imgUrl || '';

  // const description = page.properties.Description.rich_text[0] ? page.properties.Description.rich_text[0].plain_text : '';

  return {
    id: page.id,
    thumbnailUrl: imgUrl,
    title: page.properties.Name.title[0].plain_text,
    tags: page.properties.Tags.multi_select,
    categories: page.properties.category.select,
    description: page.properties.Description.rich_text[0]?.plain_text ?? '',
    date: dayjs(page.properties.Updated.last_edited_time).format('LL'),
    slug: page.properties.Slug.formula.string,
    infoPrevNextPost: {
      nextPostLink: page.properties.NextPostLink.rich_text[0]?.plain_text ?? '',
      nextPostTitle: page.properties.NextPostTitle.rich_text[0]?.plain_text ?? '',
      nextPostImg: page.properties.NextPostImg.rich_text[0]?.plain_text ?? '',
      prevPostLink: page.properties.PrevPostLink.rich_text[0]?.plain_text ?? '',
      prevPostTitle: page.properties.PrevPostTitle.rich_text[0]?.plain_text ?? '',
      prevPostImg: page.properties.PrevPostImg.rich_text[0]?.plain_text ?? ''
    }
  };
};

/**
 * This function retrieves data from a Notion database. will continue to make additional
 * requests to the Notion API until either the desired number of entries is reached or there
 * are no more entries left.
 * @returns a Promise that resolves to an array of Notion database entries that meet the specified
 * filter criteria, sorted by the "Posted on" property in descending order. The number of entries
 * returned is determined by the `postsCount` parameter
 */
async function getData(response, postsCount, data) {
  const newResponse = await notion.dataSources.query({
    data_source_id: await getDataSourceId(),
    filter: {
      property: 'Published',
      checkbox: {
        equals: true
      }
    },
    page_size: postsCount,
    sorts: [
      {
        property: 'Posted on',
        direction: 'descending'
      }
    ],
    start_cursor: response.next_cursor
  });

  data = [...data, ...newResponse.results];

  if (newResponse.has_more && postsCount && data.length < postsCount) {
    return getData(newResponse, postsCount, data);
  }
  return data;
}

/**
 * This function retrieves a specified number of published blog posts from a Notion database and
 * transforms them into a specific format.
 * @param {number} postsCount maximum number of posts to retrieve. `0` means all.
 * @returns The function `getPublishedBlogPosts` is returning an array of blog post objects that have
 * been filtered and sorted based on certain criteria. Each post object is transformed using the
 * `pageToPostTransformer` function before being added to the array.
 */
export const getPublishedBlogPosts = async (postsCount) => {
  try {
    const response = { has_more: true };
    const fetchedData = await getData(response, postsCount, []);

    return fetchedData.map((res) => pageToPostTransformer(res));
  } catch (error) {
    console.warn(`Unable to load published Notion posts: ${error.message}`);
    return [];
  }
};

export const getAllTagsFromPosts = async (posts) => {
  const taggedPosts = posts.filter((post) => post?.tags);

  const tags = [...taggedPosts.map((p) => p.tags).flat()];
  const tagObj = {};
  tags.forEach((tag) => {
    if (tag.name in tagObj) {
      tagObj[tag.name] += 1;
    } else {
      tagObj[tag.name] = 1;
    }
  });
  return tagObj;
};

export const getPage = async (pageId) => {
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const response = await notion.pages.retrieve({ page_id: pageId });
  const page = response;

  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(mdBlocks);
  const post = pageToPostTransformer(page);

  return {
    post,
    markdown
  };
};

export const getSingleBlogPost = async (slug) => {
  const n2m = new NotionToMarkdown({ notionClient: notion });
  // list of blog posts
  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(),
    filter: {
      property: 'Slug',
      formula: {
        string: {
          equals: slug // slug
        }
      }
    },
    sorts: [
      {
        property: 'Updated',
        direction: 'descending'
      }
    ]
  });

  if (!response.results[0]) {
    console.error('No results available');
  }

  // grab page from notion
  const page = response.results[0];

  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(mdBlocks);
  const postMeta = pageToPostTransformer(page);
  postMeta.readingTime = readingTime(markdown);

  return {
    postMeta,
    markdown
  };
};

export const getSinglePage = async (slug) => {
  const n2m = new NotionToMarkdown({ notionClient: notion });

  try {
    // list of blog posts
    const response = await notion.dataSources.query({
      data_source_id: await getDataSourceId(),
      filter: {
        property: 'Slug',
        formula: {
          string: {
            equals: slug // slug
          }
        }
      },
      sorts: [
        {
          property: 'Updated',
          direction: 'descending'
        }
      ]
    });

    if (!response.results[0]) {
      throw new Error('No results available');
    }

    // grab page from notion
    const page = response.results[0];
    const blocks = await notion.blocks.children.list({ block_id: page.id });

    const asyncTasks = blocks.results
      .filter((result) => result.has_children)
      .map(async (result) => {
        const mdBlocks = await n2m.pageToMarkdown(result.id);
        const markdown = n2m.toMarkdownString(mdBlocks);
        const headingText = result[result.type].rich_text[0].plain_text;

        const replacedWithFontAwesome = markdown.replace(
          /&#x(.*?);/,
          (a, b) => `<i className="fa fa-regular">&#x${b};</i>`
        );

        switch (result.type) {
          case 'heading_2':
            if (['Profile Highlights'].includes(headingText)) {
              return markdown;
            }

            return `## ${headingText}\n${markdown}`;
          case 'heading_3':
            if (['Programming', 'Tools'].includes(headingText)) {
              return markdown;
            }

            return `### ${headingText}\n${markdown}`;
          default:
            return null;
        }
      });

    const headingBlocks = await Promise.all(asyncTasks).then((results) => results.filter(Boolean));

    return {
      blocks,
      headingBlocks
    };
  } catch (error) {
    console.error(error);
    return {
      blocks: [],
      headingBlocks: []
    };
  }
};
