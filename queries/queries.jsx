import gql from 'graphql-tag';

export const PAGES_POSTS_QUERY = gql`
  query GET_POSTS( $perPage: Int, $offset: Int ){
    posts: posts(where: { offsetPagination: { size: $perPage, offset: $offset }}) {
      pageInfo {
        offsetPagination {
          total
        }
      }   
      nodes {
        id
        modified
        title
        slug
        date
        excerpt
        readingTime
        featuredImage {
          node {
            altText
            sourceUrl
          }
        }
        categories {
          edges {
            node {
              name
              uri
            }
          }
        }
        tags {
          edges {
            node {
              name
              uri
            }
          }
        } 
        author {
          node {
            id
            name
            slug
          }
        }     
      }
    }
  }
`;

export const FIRST_FIVE_POSTS = gql`
query GET_POSTS {
  posts(first: 3) {
    nodes {
      id
      modified
      title
      slug
      date
      excerpt
      readingTime
    }
  }
}
`;

export const CATEGORY_LIST = gql`
query CategoryList {
  categories {
    nodes {
      count
      slug
      name
      id
    }
  }
}
`;

export const SELECTED_POST_QUERY = gql`
  query Posts($id: ID!){
    post(id: $id, idType: DATABASE_ID) {
      id
      modified
      title
      slug
      date
      excerpt
      readingTime
      featuredImage {
        node {
          altText
          sourceUrl
        }
      }
      categories {
        edges {
          node {
            name
            uri
          }
        }
      }
      tags {
        edges {
          node {
            name
            uri
          }
        }
      } 
      author {
        node {
          id
          name
          slug
        }
      }     
    }
  }
`;

export const FIND_POST_BY_TITLE = gql`
query FindPostByTitle($title: String!) {
  posts(where: {title: $title}) {
    nodes {
      title
    }
  }
}
`;

export const GET_TOTAL_POSTS_COUNT = gql`
  query GET_TOTAL_POSTS_COUNT {
  postsCount: posts {
      pageInfo {
        offsetPagination {
          total
        }
      }
    }
  }
`;

export const FIND_POST_BY_SLUG = gql`
query FindPostBySlug($id: ID!){
  post(id: $id, idType: SLUG) {
    title
    previous {
      title
      slug
      uri
    }
    next {
      title
      slug
    }
  }
}`;

export const CREATE_POST = gql`
mutation CREATE_POST($title: String!, $content: String!, $description: String!, $slug:String!, $date:String!,   $tag: [PostTagsNodeInput]!, $cat: [PostCategoriesNodeInput!]) {
  createPost(input: {
    clientMutationId: "CreatePost"
    title: $title
    content: $content
    status: PUBLISH
    excerpt: $description
    slug:$slug
    date:$date
    tags:{
      append:true,
      nodes:$tag
    },
    categories: {
      append: true,
      nodes: $cat
    }
    }) {
    post {
      id
      title
      date
    }
  }
}
`;
/*
{"input": {
  "clientMutationId": "CreatePost",
  "title": "ghjhj",
  "content": "xxx",
  "status": "PUBLISH",
  "tags":{
    "append":true,
    "nodes":[{
      "name":"Tag-x"
    }]
  },
  "categories": {
    "append": true,
    "nodes": [{
      "name": "Cat-1"
    }]
  }
}}
*/

export const LOGIN_WP_USER = `
mutation LoginUser($username: String!, $password: String!) {
  login( input: {
    clientMutationId: "uniqueId",
    username: $username,
    password: $password
  } ) {
    authToken
    user {
      id
      name
    }
  }
}`;
