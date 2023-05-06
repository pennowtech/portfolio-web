import React, { useRef, useCallback, useState } from 'react';

const Search = () => {
  return null;
  const [formData, setFormData] = useState({
    searchText: ''
  });

  const clickPoint = useRef();
  const handleFocus = () => {
    clickPoint.current.style.display = 'none';
  };

  const handleBlur = () => {
    clickPoint.current.style.display = 'block';
  };

  const handleChange = useCallback(
    (e) => {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [e.target.name]: e.target.value
      }));
    },
    [setFormData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('-----', formData);
  };

  return (
    <form className='items-center px-4 mt-8 flex justify-center w-full'>
      <div className='relative mr-3'>
        <div className='absolute top-3 left-3 items-center' ref={clickPoint}>
          <svg
            className='w-5 h-5 text-gray-500'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              fillRule='evenodd'
              d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <input
          type='text'
          className='p-2 pl-10 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:pl-3'
          placeholder='Search Here...'
          name='searchText'
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        <div
          className='text-center button focus:shadow-outline  '
          type='submit'
          role='button'
          onClick={handleSubmit}
          onKeyPress={handleSubmit}
        >
          Search
        </div>
      </div>
    </form>
  );
};

export default Search;
