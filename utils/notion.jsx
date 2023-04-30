import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import dayjs from 'dayjs';
import readingTime from 'reading-time';

const localizedFormat = require('dayjs/plugin/localizedFormat');

dayjs.extend(localizedFormat);

const databaseId = process.env.NOTION_DATABASE_ID ?? '';

const notion = new Client({
  auth: process.env.NOTION_KEY,
});

export const getNotionDatabase = async () => {
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response.results;
};

const pageToPostTransformer = (page, isPrevNextPostIteration = false) => {
  let imgUrl = page.cover?.type === 'file' ? page.cover?.file.url : page.cover?.external?.url;
  imgUrl = imgUrl || '';

  // eslint-disable-next-line max-len
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
      prevPostImg: page.properties.PrevPostImg.rich_text[0]?.plain_text ?? '',
    },
  };
};

export const getPublishedBlogPosts = async () => {
  // list blog posts
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Published',
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: 'Updated',
        direction: 'descending',
      },
    ],
  });

  return response.results.map((res) => pageToPostTransformer(res));
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
    markdown,
  };
};

export const getSingleBlogPost = async (slug) => {
  const n2m = new NotionToMarkdown({ notionClient: notion });
  // list of blog posts
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Slug',
      formula: {
        string: {
          equals: slug, // slug
        },
      },
    },
    sorts: [
      {
        property: 'Updated',
        direction: 'descending',
      },
    ],
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
    markdown,
  };
};

export const getSinglePage = async (slug) => {
  const n2m = new NotionToMarkdown({ notionClient: notion });

  try {
    // list of blog posts
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Slug',
        formula: {
          string: {
            equals: slug, // slug
          },
        },
      },
      sorts: [
        {
          property: 'Updated',
          direction: 'descending',
        },
      ],
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
          (a, b) => `<i className="fa fa-regular">&#x${b};</i>`,
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
      headingBlocks,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};
