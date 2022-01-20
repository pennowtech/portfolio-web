import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { Element } from 'react-scroll';
import BlogMain from '../components/Intro/IntroHighlight';
import Login from '../components/Login';
import ThemeToggle from '../components/ThemeToggle';
import Header from '../components/HeaderMain';
import HomeArticles from '../components/HomeArticles';
import 'tailwindcss/tailwind.css';
import ContactForm from '../components/ContactForm';
import Layout from '../components/Layout';

function Home({ posts, selectedposts }) {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };
  return (
    <Layout metaInfo={metaInfo}>
      {' '}
      <div className="w-full lg:max-w-[1167px] lg:mx-auto p-5">
        <Element id="about-me" className="element min-h-[600px]">
          <Login />
        </Element>
        <Element id="blog" className="element min-h-[630px]">
          <BlogMain />
        </Element>
        <Element id="articles" className="element min-h-[630px]">
          <HomeArticles posts={posts} selectedposts={selectedposts} />
        </Element>
        <Element id="notifications" className="element min-h-[600px]">
          test 3
        </Element>
        <ContactForm />
      </div>
    </Layout>
  );
}

export const getStaticProps = async () => {
  const a = {
    query: `
mutation LoginUser {
  login( input: {
    clientMutationId: "uniqueId",
    username: "sdsingh.developer@gmail.com",
    password: "Pa85M29ErY"
  } ) {
    authToken
    user {
      id
      name
    }
  }
}`,
  };

  const c = {
    query: `
{
  posts(first: 31) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      title
      slug
    }
  }
}`,
  };

  const b = {
    query: `mutation CREATE_POST {
  createPost(input: {
    clientMutationId: "CreatePost"
    title: "New Post Title3"
    content:"<p><a href="http://kdiff3.sourceforge.net">Kdiff3</a> has been my favourite diff tool"
  }) {
    post {
      id
      title
      date
    }
  }
}
    `,
  };

  fetch('https://pennow.tech/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(a),
  })
    .then((res) => res.json())
    .then((res) => console.log(res));

  fetch('https://pennow.tech/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvcGVubm93LnRlY2giLCJpYXQiOjE2NDIyODkwODQsIm5iZiI6MTY0MjI4OTA4NCwiZXhwIjoxNjQyMjg5Mzg0LCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.EArO1qOSCZmuDTD5Gi0pEd-T2VhqeQKS9cTuMjuwVCo',
    },
    body: JSON.stringify(b),
  })
    .then((res) => res.json())
    .then((res) => console.log(res));

  const files = fs.readdirSync(path.join('posts'));
  const posts = files.map((filename) => {
    const markdownWithMeta = fs.readFileSync(
      path.join('posts', filename),
      'utf-8',
    );
    const { data: frontMatter } = matter(markdownWithMeta);
    return {
      frontMatter,
      blog: filename.split('.')[0],
    };
  });

  const res = await fetch('http://localhost:3000/api/selectedposts', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const selectedposts = await res.json();

  return {
    props: {
      posts,
      selectedposts: selectedposts.message || [],
    },
  };
};

export default withUrqlClient(
  () => ({
    url: 'https://wordpress-561320-2383780.cloudwaysapps.com/graphql',
  }),
  { ssr: true },
)(Home);
