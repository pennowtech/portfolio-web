import React from 'react';
import Link from 'next/link';
import { useQuery } from 'urql';
import { CATEGORY_LIST } from '../queries/queries';

const SidebarCategories = () => {
  const [result, getPosts] = useQuery({ query: CATEGORY_LIST });
  const { data, fetching, error } = result;
  if (fetching) return <div>Fetching</div>;
  if (error) return <div>{error}</div>;

  let categories = data?.categories?.nodes || [];
  categories.sort((a, b) => Date.parse(b.count) - Date.parse(a.count));
  categories = categories.filter((cat) => !(cat.name === 'Uncategorized' || cat.count === null));
  console.warn(1234, 'Fetching All Posts data...', categories);

  return (
    <div className="font-medium mx-auto px-2 py-1 md:px-4 whitespace-nowrap overflow-hidden">
      <h4 className="border-b-2">Categories</h4>
      { categories.map((cat) => (
        <div key={cat.id} className="text-base py-2 flex h-full items-center justify-between">
          <Link href={`/category/${cat.slug}`}>
            <a>
              {cat.name}
            </a>
          </Link>
          <div className="ml-2 px-2 py-1 rounded-full text-slate-200 bg-blue-500 text-xs ">{cat.count}</div>
        </div>
      )) }
    </div>
  );
};

export default SidebarCategories;
