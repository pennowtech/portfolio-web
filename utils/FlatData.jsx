import React from 'react';

export function FlatMDXData(postData) {
  const { frontMatter } = postData;
  const post = {};
  post.title = frontMatter.title;
  post.thumbnailUrl = frontMatter.thumbnailUrl ? frontMatter.thumbnailUrl : '/blank.jpg';
  post.categories = frontMatter.categories.map((cat) => {
    const catDict = {};
    catDict.name = cat;
    catDict.slug = undefined;
    return catDict;
  });
  post.altText = frontMatter.title;
  post.date = frontMatter.date;
  post.tags = frontMatter.tags.map((tag) => {
    const tagDict = {};
    tagDict.name = tag;
    tagDict.slug = '';
    return tagDict;
  });
  post.excerpt = frontMatter.description;
  post.link = postData.blog;
  return post;
}

export function FlatWPData(postData) {
  const post = {};
  post.title = postData?.title;
  post.thumbnailUrl = postData?.featuredImage ? postData?.featuredImage.node.sourceUrl : `/${postData.slug}.png`;
  post.categories = postData.categories.edges.map((cat) => {
    const catDict = {};
    catDict.name = cat.node.name;
    catDict.slug = cat.node.slug;
    return catDict;
  });
  post.altText = postData.featuredImage?.node?.altText;
  if (new Date(postData.modified) > new Date('2022-11-13')) {
    post.date = postData.date;
  } else {
    post.date = postData.modified;
  }
  // post.date = postData.modified;
  post.tags = postData.tags.edges.map((tag) => {
    const tagDict = {};
    tagDict.name = tag.node.name;
    tagDict.slug = tag.node.slug;
    return tagDict;
  });
  post.excerpt = postData.excerpt;
  post.readingTime = postData.readingTime;
  post.link = postData.slug;
  return post;
}
