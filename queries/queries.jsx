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
