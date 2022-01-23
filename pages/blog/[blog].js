import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import readingTime from 'reading-time'

import Image from 'next/image'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const data = { btn_text: 'Click Me' }
// const data = { btn_text: 'Click Me', theme: a11yDark }

import Button from '../../components/Button'
import code from '../../components/Code'

export const getStaticPaths = async () => {
  const files = fs.readdirSync(path.join('posts'))
  const paths = files.map(filename => ({
    params: {
      blog: filename.replace('.mdx', '')
    }
  }))
  return {
    paths,
    fallback: false
  }
}

export const getStaticProps = async ({ params: { blog } }) => {
  const markdownWithMeta = fs.readFileSync(path.join('posts',
    blog + '.mdx'), 'utf-8')

  const { data: frontMatter, content } = matter(markdownWithMeta)
  const mdxSource = await serialize(content)
  // console.log(mdxSource)
  //   const source = `---
  // title: Test
  // --------

  // Some **mdx** text, with a component <Button text={year}/>
  //   `;

  //   const { content } = matter(source);
  //   const mdxSource = await serialize(content, { scope: data });

  return {
    props: {
      frontMatter: {
        readingTime: readingTime(content),
        ...frontMatter
      },
      mdxSource
    }
  }
}

const PostPage = ({ frontMatter, mdxSource }) => {
  return (
    <div className="mt-4">
      <h1>{frontMatter.title}</h1>
      <p>{frontMatter.description}</p>
      <p>{frontMatter.date}</p>
      <p className="font-bold  text-green-500">{frontMatter.readingTime.text}</p>
      <article>
        <MDXRemote {...mdxSource} components={{ Button, code, Image }} scope={data} />
      </article>
    </div>
  )
}

export default PostPage