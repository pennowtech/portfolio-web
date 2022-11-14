### Wordpress:
Install WPGraphQL plugin.
To fix `reading time` issue, create a plugin file inside `plugins/wp-graphql-reading-time/wp-graphql-reading-time.php` and copy content of the respective file from https://github.com/m-muhsin/wp-graphql-reading-time/blob/master/wp-graphql-reading-time.php
Reload the page. Enter following graphql query from GraphiQL editor. It should run fine without any error.
```graphql
{
  post(id: 1, idType: DATABASE_ID) {
    id
    modified
    title
    slug
    date
    readingTime
    excerpt
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
```

### Install WPGraphQL Offsetpagination plugin:
https://github.com/valu-digital/wp-graphql-offset-pagination


### Install WPGraphQL Login plugin
https://github.com/wp-graphql/wp-graphql-jwt-authentication.git

----


### Code:
In consts.jsx, change ids of `export const SelectedPostsList = [1, 6];`. These ids must be same as whatever ids are present in wordpress database.



in `.env.local`, add `NODE_TLS_REJECT_UNAUTHORIZED = "0"`. This will remove the certification error while making graphql request

Next error:
```shell
error - Error: Error serializing `.data` returned from `getStaticProps` in "/blog".
Reason: `undefined` cannot be serialized as JSON. Please use `null` or omit this value.
```


## Other Inputs
Save all images in `.png` format. Because `FlatWPData()` exects all images extension in `.png` format