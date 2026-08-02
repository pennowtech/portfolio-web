import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

export const MARKDOWN_SOURCE_MARKER = 'SBT_MARKDOWN_SOURCE_V1';
const MAX_MARKDOWN_LENGTH = 150000;
const RICH_TEXT_CHUNK_LENGTH = 1900;

const notion = new Client({ auth: process.env.NOTION_KEY });
const notionToMarkdown = new NotionToMarkdown({ notionClient: notion });

const chunks = (value, size = RICH_TEXT_CHUNK_LENGTH) => {
  const result = [];
  for (let index = 0; index < value.length; index += size) result.push(value.slice(index, index + size));
  return result;
};

const textObjects = (value) => chunks(value).map((content) => ({ type: 'text', text: { content } }));

const propertyByName = (schema, name) => schema[name];

const setProperty = (properties, schema, name, expectedType, value) => {
  const property = propertyByName(schema, name);
  if (!property || property.type !== expectedType) return;

  switch (expectedType) {
    case 'title':
      properties[name] = { title: textObjects(value) };
      break;
    case 'rich_text':
      properties[name] = { rich_text: textObjects(value) };
      break;
    case 'multi_select':
      properties[name] = { multi_select: value.map((item) => ({ name: item })) };
      break;
    case 'select':
      properties[name] = value ? { select: { name: value } } : { select: null };
      break;
    case 'checkbox':
      properties[name] = { checkbox: Boolean(value) };
      break;
    case 'date':
      properties[name] = value ? { date: { start: value } } : { date: null };
      break;
    default:
      break;
  }
};

const getDataSource = async () => {
  const database = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
  const dataSourceId = database.data_sources?.[0]?.id;
  if (!dataSourceId) throw new Error('The articles database does not contain a data source.');
  return notion.dataSources.retrieve({ data_source_id: dataSourceId });
};

export const getArticleTaxonomy = async () => {
  const dataSource = await getDataSource();
  const categoryProperty = dataSource.properties?.category;
  const tagProperty = dataSource.properties?.Tags;
  const articles = [];
  let startCursor;
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSource.id,
      page_size: 100,
      start_cursor: startCursor,
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }]
    });
    articles.push(
      ...response.results.map((page) => ({
        id: page.id,
        title: page.properties?.Name?.title?.map((item) => item.plain_text).join('') || 'Untitled article',
        slug: propertyText(page.properties?.Slug),
        published: page.properties?.Published?.checkbox === true,
        publicationDate: page.properties?.['Posted on']?.date?.start || '',
        updatedDate: page.last_edited_time?.slice(0, 10) || '',
        category: page.properties?.category?.select?.name || '',
        tags: page.properties?.Tags?.multi_select?.map((tag) => tag.name) || [],
        notionUrl: page.url
      }))
    );
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);
  return {
    categories: categoryProperty?.type === 'select' ? categoryProperty.select.options.map(({ name }) => name) : [],
    tags: tagProperty?.type === 'multi_select' ? tagProperty.multi_select.options.map(({ name }) => name) : [],
    articles
  };
};

const uploadCover = async ({ dataUrl, name }) => {
  const match = /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/i.exec(dataUrl || '');
  if (!match) throw new Error('The uploaded cover image is invalid.');
  const bytes = Buffer.from(match[2], 'base64');
  const upload = await notion.fileUploads.create({ mode: 'single_part', filename: name, content_type: match[1] });
  await notion.fileUploads.send({
    file_upload_id: upload.id,
    file: { filename: name, data: new Blob([bytes], { type: match[1] }) }
  });
  return { type: 'file_upload', file_upload: { id: upload.id } };
};

const propertyText = (property) => {
  if (!property) return '';
  if (property.type === 'formula') return property.formula?.string || '';
  if (property.type === 'rich_text') return property.rich_text?.map((item) => item.plain_text).join('') || '';
  if (property.type === 'title') return property.title?.map((item) => item.plain_text).join('') || '';
  return '';
};

const assertUniqueSlug = async (dataSourceId, slug, excludedPageId) => {
  let startCursor;
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: startCursor
    });
    const duplicate = response.results.some(
      (page) => page.id !== excludedPageId && propertyText(page.properties?.Slug).trim().toLowerCase() === slug
    );
    if (duplicate) {
      const error = new Error(`An article already uses the slug "${slug}".`);
      error.code = 'DUPLICATE_SLUG';
      throw error;
    }
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);
};

const getMarkdownSourceBlock = async (pageId) => {
  let startCursor;
  do {
    const response = await notion.blocks.children.list({ block_id: pageId, page_size: 100, start_cursor: startCursor });
    const block = response.results.find(
      (item) =>
        item.type === 'code' && item.code?.caption?.some((caption) => caption.plain_text === MARKDOWN_SOURCE_MARKER)
    );
    if (block) return block;
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);
  return null;
};

export const getNotionArticleForEditing = async (pageId) => {
  const page = await notion.pages.retrieve({ page_id: pageId });
  const sourceBlock = await getMarkdownSourceBlock(pageId);
  let markdown = sourceBlock?.code?.rich_text?.map((item) => item.plain_text).join('') || '';
  if (!markdown) {
    const blocks = await notionToMarkdown.pageToMarkdown(pageId);
    const converted = notionToMarkdown.toMarkdownString(blocks);
    markdown = typeof converted === 'string' ? converted : converted?.parent || '';
  }
  return {
    id: page.id,
    title: propertyText(page.properties?.Name),
    slug: propertyText(page.properties?.Slug),
    description: propertyText(page.properties?.Description),
    category: page.properties?.category?.select?.name || '',
    tags: page.properties?.Tags?.multi_select?.map((tag) => tag.name) || [],
    publicationDate: page.properties?.['Posted on']?.date?.start || new Date().toISOString().slice(0, 10),
    published: page.properties?.Published?.checkbox === true,
    coverUrl: page.cover?.type === 'external' ? page.cover.external.url : '',
    markdown,
    notionUrl: page.url
  };
};

export const updateNotionArticle = async (pageId, article) => {
  const dataSource = await getDataSource();
  const schema = dataSource.properties || {};
  const properties = {};
  await assertUniqueSlug(dataSource.id, article.slug, pageId);
  setProperty(properties, schema, 'Name', 'title', article.title);
  setProperty(properties, schema, 'Description', 'rich_text', article.description);
  setProperty(properties, schema, 'Tags', 'multi_select', article.tags);
  setProperty(properties, schema, 'category', 'select', article.category);
  setProperty(properties, schema, 'Published', 'checkbox', article.published);
  setProperty(properties, schema, 'Posted on', 'date', article.publicationDate || null);
  setProperty(properties, schema, 'Slug', 'rich_text', article.slug);

  const storedMarkdown = `${article.markdown}${
    article.coverCredit
      ? `\n\n---\n\n<small>Cover photo by [${article.coverCredit.photographer}](${article.coverCredit.profileUrl}) on [${article.coverCredit.provider}](${article.coverCredit.providerUrl}).</small>`
      : ''
  }`;
  const cover = article.coverUpload
    ? await uploadCover(article.coverUpload)
    : article.coverUrl
      ? { type: 'external', external: { url: article.coverUrl } }
      : null;
  const page = await notion.pages.update({ page_id: pageId, properties, ...(cover ? { cover } : {}) });
  const sourceBlock = await getMarkdownSourceBlock(pageId);
  const code = {
    language: 'markdown',
    rich_text: textObjects(storedMarkdown),
    caption: [{ type: 'text', text: { content: MARKDOWN_SOURCE_MARKER } }]
  };
  if (sourceBlock) await notion.blocks.update({ block_id: sourceBlock.id, code });
  else await notion.blocks.children.append({ block_id: pageId, children: [{ object: 'block', type: 'code', code }] });
  return { id: page.id, url: page.url, slug: article.slug, published: article.published };
};

export const createNotionArticle = async ({
  title,
  slug,
  description,
  coverUrl,
  coverUpload,
  coverCredit,
  publicationDate,
  category,
  tags,
  markdown,
  published
}) => {
  if (!process.env.NOTION_KEY || !process.env.NOTION_DATABASE_ID) {
    throw new Error('The Notion articles database is not configured.');
  }
  const storedMarkdown = `${markdown}${
    coverCredit
      ? `\n\n---\n\n<small>Cover photo by [${coverCredit.photographer}](${coverCredit.profileUrl}) on [${coverCredit.provider}](${coverCredit.providerUrl}).</small>`
      : ''
  }`;
  if (storedMarkdown.length > MAX_MARKDOWN_LENGTH) throw new Error('Markdown exceeds the 150,000 character limit.');

  const dataSource = await getDataSource();
  const schema = dataSource.properties || {};
  const properties = {};

  await assertUniqueSlug(dataSource.id, slug);

  setProperty(properties, schema, 'Name', 'title', title);
  setProperty(properties, schema, 'Description', 'rich_text', description);
  setProperty(properties, schema, 'Tags', 'multi_select', tags);
  setProperty(properties, schema, 'category', 'select', category);
  setProperty(properties, schema, 'Published', 'checkbox', published);
  setProperty(properties, schema, 'Posted on', 'date', publicationDate || null);
  setProperty(properties, schema, 'Slug', 'rich_text', slug);

  if (!properties.Name) throw new Error('The Notion articles database must contain a Name title property.');

  const cover = coverUpload
    ? await uploadCover(coverUpload)
    : coverUrl
      ? { type: 'external', external: { url: coverUrl } }
      : null;
  const page = await notion.pages.create({
    parent: { data_source_id: dataSource.id },
    properties,
    ...(cover ? { cover } : {}),
    children: [
      {
        object: 'block',
        type: 'code',
        code: {
          language: 'markdown',
          rich_text: textObjects(storedMarkdown),
          caption: [{ type: 'text', text: { content: MARKDOWN_SOURCE_MARKER } }]
        }
      }
    ]
  });

  return { id: page.id, url: page.url, slug, published };
};
