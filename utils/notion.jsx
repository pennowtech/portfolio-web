import {Client} from "@notionhq/client";
import {NotionToMarkdown} from "notion-to-md";
import dayjs from "dayjs";
import readingTime from "reading-time";

const localizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(localizedFormat);

const databaseId = process.env.NOTION_DATABASE_ID ?? "";

const notion = new Client({
  auth: process.env.NOTION_KEY,
});

export const getNotionDatabase = async () => {
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response.results;
};

export const getPublishedBlogPosts = async () => {
  // list blog posts
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Published",
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: "Updated",
        direction: "descending",
      },
    ],
  });

  return response.results.map((res) => {
    return pageToPostTransformer(res);
  });
};

export const getPage = async (pageId) => {
  const n2m = new NotionToMarkdown({notionClient: notion});
  const response = await notion.pages.retrieve({page_id: pageId});
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
  const n2m = new NotionToMarkdown({notionClient: notion});
  // list of blog posts
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Slug",
      formula: {
        string: {
          equals: slug, // slug
        },
      },
    },
    sorts: [
      {
        property: "Updated",
        direction: "descending",
      },
    ],
  });

  if (!response.results[0]) {
    console.error("No results available");
  }

  // grab page from notion
  const page = response.results[0];

  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(mdBlocks);
  const postMeta = pageToPostTransformer(page);
  postMeta['readingTime'] = readingTime(markdown);

  return {
    postMeta,
    markdown,
  };
};

const pageToPostTransformer = (page) => {
  let imgUrl =
      page.cover?.type === "file"
          ? page.cover?.file.url
          : page.cover?.external?.url;
  imgUrl = imgUrl ? imgUrl : "";

  const description = page.properties.Description.rich_text[0]
      ? page.properties.Description.rich_text[0].plain_text
      : "";

  return {
    id: page.id,
    thumbnailUrl: imgUrl,
    title: page.properties.Name.title[0].plain_text,
    tags: page.properties.Tags.multi_select,
    categories: page.properties.category.select,
    description: description,
    date: dayjs(page.properties.Updated.last_edited_time).format("LL"),
    slug: page.properties.Slug.formula.string,
  };
};
