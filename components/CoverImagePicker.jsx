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
  error,
  compact = false
}) => {
  const inputRef = useRef(null);
  const [tab, setTab] = useState('link');
  const [sourcesOpen, setSourcesOpen] = useState(!compact);
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

  const clearImage = () => {
    onUrlChange('');
    onUploadChange(null);
    onCreditChange(null);
    setProviderMessage('');
  };

  return (
    <div className='w-full space-y-2.5'>
      {/* Cover Preview Card */}
      <div className='relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950/60'>
        {preview ? (
          <div className='relative group aspect-video w-full overflow-hidden'>
            <img
              src={preview}
              alt='Article cover preview'
              className='h-full w-full object-cover transition duration-300 group-hover:scale-102'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity' />
            <button
              type='button'
              onClick={clearImage}
              title='Remove cover image'
              className='absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-xs transition hover:bg-red-600'
            >
              ×
            </button>
            {coverCredit && (
              <div className='absolute bottom-0 inset-x-0 p-2 text-[10px] text-white/90 truncate bg-slate-950/70 backdrop-blur-xs'>
                Photo by{' '}
                <a
                  href={coverCredit.profileUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='underline hover:text-emerald-300'
                >
                  {coverCredit.photographer}
                </a>{' '}
                on{' '}
                <a
                  href={coverCredit.providerUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='underline hover:text-emerald-300'
                >
                  {coverCredit.provider}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className='flex aspect-video w-full flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500'>
            <FiImage className='size-6 opacity-60' />
            <span className='text-[11px] font-medium'>No cover image set</span>
            <span className='text-[9px] text-slate-400 dark:text-slate-500'>1600 × 900 landscape</span>
          </div>
        )}
      </div>

      {/* Tabs & Source Controls */}
      {compact && (
        <button
          type='button'
          aria-expanded={sourcesOpen}
          onClick={() => setSourcesOpen((open) => !open)}
          className='text-xs text-emerald-700 underline underline-offset-4 dark:text-emerald-300'
        >
          {sourcesOpen ? 'Hide cover options' : preview ? 'Change cover artwork' : 'Choose cover artwork'}
        </button>
      )}
      {compact && !sourcesOpen && error && <p className='text-xs text-red-700 dark:text-red-300'>{error}</p>}
      <div
        hidden={!sourcesOpen}
        className='overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/80'
      >
        <div className='flex border-b border-slate-100 bg-slate-50/60 p-1 dark:border-slate-800 dark:bg-slate-950/40'>
          {[
            ['link', FiLink, 'Link'],
            ['upload', FiUpload, 'Upload'],
            ['unsplash', FiSearch, 'Stock']
          ].map(([value, Icon, label]) => (
            <button
              key={value}
              type='button'
              onClick={() => setTab(value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                tab === value
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-emerald-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className='size-3' />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className='p-3'>
          {tab === 'link' && (
            <div className='space-y-2'>
              <input
                type='url'
                aria-label='Cover image URL'
                value={coverUrl}
                onChange={(event) => {
                  onUploadChange(null);
                  onCreditChange(null);
                  onUrlChange(event.target.value);
                }}
                placeholder='https://images.unsplash.com/…'
                className='w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white'
              />
              <div className='flex flex-wrap items-center gap-1.5 pt-1'>
                <span className='text-[10px] font-medium text-slate-400'>Free assets:</span>
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
                    className='inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-300'
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
              className='flex min-h-24 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 text-center transition hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-emerald-500/50'
            >
              <FiUpload className='mb-1 size-5 text-emerald-600 dark:text-emerald-400' />
              <span className='text-xs font-semibold text-slate-700 dark:text-slate-200'>
                {coverUpload ? coverUpload.name : 'Drop image or browse'}
              </span>
              <span className='text-[10px] text-slate-400 mt-0.5'>JPG, PNG, GIF, WebP under 5 MB</span>
            </button>
          )}

          {tab === 'unsplash' && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <div className='inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-950'>
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
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize transition ${
                        searchProvider === provider
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
                <span className='text-[10px] text-slate-400'>Free license</span>
              </div>

              <div className='flex gap-1.5'>
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
                  placeholder='Search keywords…'
                  className='min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white'
                />
                <button
                  type='button'
                  onClick={search}
                  disabled={loading}
                  className='rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-60'
                >
                  {loading ? '…' : 'Find'}
                </button>
              </div>

              {images.length > 0 && (
                <div className='grid max-h-[190px] grid-cols-2 auto-rows-[80px] gap-1.5 overflow-y-auto pr-0.5 custom-scrollbar'>
                  {images.map((image) => (
                    <button
                      key={image.id}
                      type='button'
                      onClick={() => selectProviderImage(image)}
                      className='group relative h-[80px] w-full overflow-hidden rounded-lg border border-slate-200 text-left transition hover:ring-2 hover:ring-emerald-500 dark:border-slate-700'
                    >
                      <img
                        src={image.thumb}
                        alt={image.alt}
                        className='h-full w-full object-cover group-hover:scale-105 transition duration-200'
                      />
                      <div className='absolute inset-x-0 bottom-0 bg-black/60 p-1 backdrop-blur-xs'>
                        <span className='block truncate text-[9px] text-white leading-tight'>{image.photographer}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
            <p
              className={`mt-2 text-xs ${error ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {error || providerMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverImagePicker;
