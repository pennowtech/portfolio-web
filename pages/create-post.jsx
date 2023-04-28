/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import matter from 'gray-matter';
import dynamic from 'next/dynamic';
import '@uiw/react-markdown-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useRouter } from 'next/router';
import { isEmpty } from 'lodash';
import { DateForDateTime } from '../utils/date';
import {
  setToken, getToken, getLoggedUser, deleteToken,
} from '../utils/token';
import HeaderMain from '../components/HeaderMain';
import FullLayout from '../components/FullLayout';

const MDEditor = dynamic(
  () => import('@uiw/react-markdown-editor').then((mod) => mod.default),
  { ssr: false },
);

const CreatePost = ({ posts }) => {
  const router = useRouter();
  useEffect(() => {
    const authToken = getToken();
    if (isEmpty(authToken)) {
      router.push('/login/?page=create-post');
    }
  }, [router]);

  const metaInfo = {
    title: 'Create Post',
    metaKeywords: 'markdown',
    metaDesc: '',
  };
  const [markdown, setMarkdown] = useState('');
  const [fileInfo, setFileInfo] = useState({ filename: '', lastModifiedDate: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  let fileReader;
  const handleFileRead = (e) => {
    const content = fileReader.result;
    setMarkdown(fileReader.result);
  };
  const handleFileUpload = (file) => {
    setFileInfo({ filename: file.name.replace('.mdx', ''), lastModifiedDate: DateForDateTime(file.lastModifiedDate) });
    fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(file);
  };

  const saveMarkdown = async (e) => {
    e.stopPropagation();
    const { data: frontMatter, content } = matter(markdown);
    frontMatter.date = DateForDateTime(frontMatter.date);
    const categories = frontMatter?.categories?.map((cat) => ({
      name: cat,
    }));
    const tags = frontMatter?.tags?.map((tag) => ({
      name: tag,
    }));
    const postInfo = {
      ...frontMatter, ...fileInfo, content, categories, tags,
    };

    setLoading(true);
    setErrorMessage('');

    // gqlAuthClient().mutation(CREATE_POST, {
    //   // eslint-disable-next-line max-len
    //   title: postInfo.title, content: postInfo.content, description: postInfo.description,
    //         slug: postInfo.filename, date: postInfo.date, tag: postInfo.tags, cat: postInfo.categories,
    // })
    //   .toPromise()
    //   .then((result) => {
    //     setLoading(false);
    //     if (result.error) {
    //       console.error('SDSingh Error:', result.error.message);
    //       if (result.error.message === '[GraphQL] Internal server error') {
    //         deleteToken();
    //         const errorMsg = (
    //           <>
    //             <p>{result.error.message}</p>
    //             <p>
    //               Click to&nbsp;
    //               <Link href="/login/?page=create-post"><a>Login</a></Link>
    //               {' '}
    //               again
    //             </p>
    //           </>
    //         );
    //         setErrorMessage(errorMsg);
    //       }
    //     } else {
    //       // eslint-disable-next-line no-console
    //       console.log('Post created succesfully...');
    //     }
    //   });
  };

  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain />
      {getLoggedUser() && (
      <div className="text-3xl mx-auto w-full py-4 text-center underline underline-offset-1">
        Welcome
        {' '}
        {getLoggedUser()}
      </div>
      )}
      <div className="p-4">
        <input className="py-4 text-base" id="fileInput" type="file" accept=".mdx" onChange={(e) => handleFileUpload(e.target.files[0])} />
        <div>
          <MDEditor
            height={400}
            value={markdown}
            onChange={(editor, data, value) => setMarkdown(value)}
          />
        </div>
        <div className="grid font-Monda justify-center">
          <button
            type="button"
            className="pointer my-4 text-center mx-auto  button"
            onClick={saveMarkdown}
          >
            Create Post
          </button>
        </div>
        {loading ? <p>Loading...</p> : null }
        {loading ? <p>Loading...</p> : null }
        {errorMessage ? <p className="text-red-500">{errorMessage}</p> : null }
      </div>
    </FullLayout>
  );
};

export default CreatePost;
