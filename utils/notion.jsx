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

const toMarkdownText = (markdownOutput) => {
  if (typeof markdownOutput === 'string') return markdownOutput;
  if (!markdownOutput || typeof markdownOutput !== 'object') return '';
  if (typeof markdownOutput.parent === 'string') return markdownOutput.parent;

  return Object.values(markdownOutput)
    .filter((value) => typeof value === 'string')
    .join('\n\n');
};

const getPropertyText = (property) => {
  if (!property) return '';

  switch (property.type) {
    case 'formula':
      return property.formula?.string ?? String(property.formula?.number ?? '');
    case 'rich_text':
      return property.rich_text?.map((item) => item.plain_text).join('') ?? '';
    case 'title':
      return property.title?.map((item) => item.plain_text).join('') ?? '';
    case 'url':
      return property.url ?? '';
    default:
      return '';
  }
};

const getPageSlug = (page) => getPropertyText(page.properties?.Slug);

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
    slug: getPageSlug(page),
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

const findPageBySlug = async (slug) => {
  let startCursor;

  do {
    const response = await notion.dataSources.query({
      data_source_id: await getDataSourceId(),
      page_size: 100,
      start_cursor: startCursor,
      sorts: [
        {
          property: 'Updated',
          direction: 'descending'
        }
      ]
    });
    const page = response.results.find((result) => getPageSlug(result).toLowerCase() === slug.toLowerCase());

    if (page) return page;
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);

  return null;
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
    page_size: postsCount ? Math.min(postsCount, 100) : 100,
    sorts: [
      {
        property: 'Posted on',
        direction: 'descending'
      }
    ],
    start_cursor: response.next_cursor
  });

  data = [...data, ...newResponse.results];

  if (newResponse.has_more && (!postsCount || data.length < postsCount)) {
    return getData(newResponse, postsCount, data);
  }
  return postsCount ? data.slice(0, postsCount) : data;
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
  const markdown = toMarkdownText(n2m.toMarkdownString(mdBlocks));
  const post = pageToPostTransformer(page);

  return {
    post,
    markdown
  };
};

export const getSingleBlogPost = async (slug) => {
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const publishedPages = await getData({ next_cursor: undefined }, 0, []);
  const pageIndex = publishedPages.findIndex((result) => getPageSlug(result).toLowerCase() === slug.toLowerCase());
  const page = publishedPages[pageIndex];

  if (!page) throw new Error(`No Notion page found for slug "${slug}"`);

  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const markdown = toMarkdownText(n2m.toMarkdownString(mdBlocks));
  const postMeta = pageToPostTransformer(page);
  const olderPost = publishedPages[pageIndex + 1] ? pageToPostTransformer(publishedPages[pageIndex + 1]) : null;
  const newerPost = pageIndex > 0 ? pageToPostTransformer(publishedPages[pageIndex - 1]) : null;

  if (!postMeta.infoPrevNextPost.prevPostLink && olderPost) {
    postMeta.infoPrevNextPost.prevPostLink = olderPost.slug;
    postMeta.infoPrevNextPost.prevPostTitle = olderPost.title;
    postMeta.infoPrevNextPost.prevPostImg = olderPost.thumbnailUrl;
  }

  if (!postMeta.infoPrevNextPost.nextPostLink && newerPost) {
    postMeta.infoPrevNextPost.nextPostLink = newerPost.slug;
    postMeta.infoPrevNextPost.nextPostTitle = newerPost.title;
    postMeta.infoPrevNextPost.nextPostImg = newerPost.thumbnailUrl;
  }

  postMeta.readingTime = readingTime(markdown);

  return {
    postMeta,
    markdown
  };
};

export const getSinglePage = async (slug) => {
  const n2m = new NotionToMarkdown({ notionClient: notion });

  try {
    const page = await findPageBySlug(slug);

    if (!page) throw new Error(`No Notion page found for slug "${slug}"`);
    const blocks = await notion.blocks.children.list({ block_id: page.id });

    const asyncTasks = blocks.results
      .filter((result) => result.has_children)
      .map(async (result) => {
        const mdBlocks = await n2m.pageToMarkdown(result.id);
        const markdown = toMarkdownText(n2m.toMarkdownString(mdBlocks));
        const headingText = result[result.type].rich_text[0]?.plain_text ?? '';

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
