/* eslint-disable @next/next/no-img-element -- previews accept runtime data URLs and arbitrary user-provided hosts */
import React, { useRef, useState } from 'react';
import { FiImage, FiLink, FiSearch, FiUpload } from 'react-icons/fi';

const CoverImagePicker = ({
  coverUrl,
  coverUpload,
  coverCredit,
  onUrlChange,
  onUploadChange,
  onCreditChange,
  error
}) => {
  const inputRef = useRef(null);
  const [tab, setTab] = useState('link');
  const [query, setQuery] = useState('software architecture');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providerMessage, setProviderMessage] = useState('');
  const [searchProvider, setSearchProvider] = useState('unsplash');
  const [searchPage, setSearchPage] = useState(0);
  const preview = coverUpload?.dataUrl || coverUrl;

  const upload = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setProviderMessage('Choose a JPG, PNG, GIF, or WebP image under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUrlChange('');
      onUploadChange({ name: file.name, dataUrl: reader.result });
      onCreditChange(null);
      setProviderMessage('This image will be uploaded into Notion when the article is saved.');
    };
    reader.readAsDataURL(file);
  };

  const search = async () => {
    setLoading(true);
    setProviderMessage('');
    try {
      const nextPage = searchPage >= 50 ? 1 : searchPage + 1;
      const response = await fetch(
        `/api/admin/images?provider=${searchProvider}&page=${nextPage}&q=${encodeURIComponent(query)}`
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setImages(result.images || []);
      setSearchPage(nextPage);
    } catch (searchError) {
      setProviderMessage(searchError.message);
    } finally {
      setLoading(false);
    }
  };

  const selectProviderImage = async (image) => {
    onUploadChange(null);
    onUrlChange(image.url);
    onCreditChange({
      photographer: image.photographer,
      profileUrl: image.profileUrl,
      provider: image.provider,
      providerUrl: image.providerUrl
    });
    if (image.downloadLocation) {
      fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: image.downloadLocation })
      }).catch(() => {});
    }
  };

  return (
    <div className='lg:col-span-2'>
      <div className='mb-2 flex items-center justify-between gap-3'>
        <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Article cover image</span>
        <span className='text-xs text-slate-500'>Recommended: landscape, at least 1600 × 900</span>
      </div>
      <div className='overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'>
        <div className='flex border-b border-slate-200 dark:border-slate-700'>
          {[
            ['link', FiLink, 'Image link'],
            ['upload', FiUpload, 'Upload'],
            ['unsplash', FiSearch, 'Stock photos']
          ].map(([value, Icon, label]) => (
            <button
              key={value}
              type='button'
              onClick={() => setTab(value)}
              className={`flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm ${tab === value ? 'border-green-700 text-green-800 dark:text-green-300' : 'border-transparent text-slate-600 dark:text-slate-300'}`}
            >
              <Icon aria-hidden='true' /> {label}
            </button>
          ))}
        </div>
        <div className='grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <div>
            {tab === 'link' && (
              <div>
                <input
                  type='url'
                  value={coverUrl}
                  onChange={(event) => {
                    onUploadChange(null);
                    onCreditChange(null);
                    onUrlChange(event.target.value);
                  }}
                  placeholder='https://…'
                  className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal dark:border-slate-600 dark:bg-slate-900'
                />
                <p className='mt-3 text-xs text-slate-500'>
                  Paste a permanent HTTPS image URL from your own site or a licensed source.
                </p>
                <div className='mt-4 flex flex-wrap gap-2 text-xs'>
                  {[
                    ['Pexels', 'https://www.pexels.com/search/'],
                    ['Pixabay', 'https://pixabay.com/images/search/'],
                    ['Openverse', 'https://openverse.org/search/image?q=']
                  ].map(([name, base]) => (
                    <a
                      key={name}
                      href={`${base}${encodeURIComponent(query)}`}
                      target='_blank'
                      rel='noreferrer'
                      className='rounded-full border border-slate-300 px-3 py-1.5 hover:border-green-700 hover:text-green-700 dark:border-slate-600'
                    >
                      {name} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
            {tab === 'upload' && (
              <button
                type='button'
                onClick={() => inputRef.current?.click()}
                onDrop={(event) => {
                  event.preventDefault();
                  upload(event.dataTransfer.files[0]);
                }}
                onDragOver={(event) => event.preventDefault()}
                className='flex min-h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 text-slate-600 hover:border-green-700 hover:text-green-700 dark:border-slate-600 dark:text-slate-300'
              >
                <FiUpload className='mb-2 text-2xl' /> Drop an image here or browse
              </button>
            )}
            {tab === 'unsplash' && (
              <div>
                <div className='mb-3 inline-flex rounded-lg border border-slate-300 p-1 dark:border-slate-600'>
                  {['unsplash', 'pexels'].map((provider) => (
                    <button
                      key={provider}
                      type='button'
                      onClick={() => {
                        setSearchProvider(provider);
                        setSearchPage(0);
                        setImages([]);
                        setProviderMessage('');
                      }}
                      className={`rounded-md px-3 py-1.5 text-sm capitalize ${searchProvider === provider ? 'bg-green-700 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
                <div className='flex gap-2'>
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSearchPage(0);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        search();
                      }
                    }}
                    className='min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900'
                  />
                  <button
                    type='button'
                    onClick={search}
                    disabled={loading}
                    className='rounded-lg bg-green-700 px-4 text-white'
                  >
                    {loading ? 'Searching…' : 'Search'}
                  </button>
                </div>
                <div className='mt-3 grid max-h-[248px] grid-cols-2 auto-rows-[120px] gap-2 overflow-y-auto pr-1 sm:grid-cols-3'>
                  {images.map((image) => (
                    <button
                      key={image.id}
                      type='button'
                      onClick={() => selectProviderImage(image)}
                      className='group h-[120px] overflow-hidden rounded-md border border-slate-200 text-left dark:border-slate-700'
                    >
                      <img src={image.thumb} alt={image.alt} className='h-24 w-full object-cover' />
                      <span className='block truncate px-2 py-1 text-[11px]'>
                        Photo by {image.photographer} · {image.provider}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              ref={inputRef}
              type='file'
              accept='image/jpeg,image/png,image/gif,image/webp'
              className='hidden'
              onChange={(event) => upload(event.target.files[0])}
            />
            {(providerMessage || error) && (
              <p className={`mt-3 text-sm ${error ? 'text-red-700 dark:text-red-300' : 'text-slate-500'}`}>
                {error || providerMessage}
              </p>
            )}
          </div>
          <div className='overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'>
            {preview ? (
              <div>
                <img src={preview} alt='Article cover preview' className='aspect-video h-full w-full object-cover' />
                {coverCredit && (
                  <p className='px-3 py-2 text-xs text-slate-500'>
                    Photo by{' '}
                    <a href={coverCredit.profileUrl} target='_blank' rel='noreferrer' className='underline'>
                      {coverCredit.photographer}
                    </a>{' '}
                    on{' '}
                    <a href={coverCredit.providerUrl} target='_blank' rel='noreferrer' className='underline'>
                      {coverCredit.provider}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div className='flex aspect-video h-full items-center justify-center text-slate-400'>
                <FiImage className='mr-2' /> Cover preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverImagePicker;
