import React from 'react';

//Only one category is supported
const PostCategories = ({categories}) => (
    <div key={categories.id}
         className="absolute py-2.5 top-0 inset-x-0 text-white font-bold flex font-Offside text-xs leading-4">
        <div className="bg-red-500 shadow-xl font-medium m-4 rounded-full px-2 py-1 md:px-4">{categories.name}</div>
    </div>
);
export default PostCategories;
