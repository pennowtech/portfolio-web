import Image from 'next/image';
import React from 'react';

const Hero = () => (
  <div>
    <section>
      <div className='w-full relative pb-10 px-6 xl:px-0'>
        <div className='pt-32 lg:flex items-center relative z-10 container mx-auto'>
          <div className='w-full lg:w-1/2 h-full lg:pr-10 xl:pr-0'>
            <Image
              aria-label='people smiling'
              className='mx-auto'
              width={200}
              height={200}
              src='/HeroImage width={20} height={20}.png'
              alt='people smiling'
            />
          </div>
          <div role='contentinfo' className='w-full lg:w-1/2 h-full'>
            <h1 className='text-4xl lg:text-5xl mb-8'>Sukhdeep Singh</h1>
            <p className=' uppercase font-semibold  font-Inter-700 text-2xl mb-4'>Senior Solution Architect</p>
            <p className='text-gray-800 mb-8'>
              COMBINING SCIENCE WITH BEAUTY. L'Oreal Paris offerincare products is developed and rigorously tested with leading
              scientists. Indulge yourself in a luxurious and sensorial skincare experience. Cutting-edge innovations, proven by
              Science.
            </p>
            <div className='bg-white lg:mt-16 py-4 px-4 flex flex-col sm:flex-row justify-start sm:justify-between items-start sm:items-center shadow-lg rounded-lg'>
              <div className='sm:flex items-center py-2'>
                <div className='flex items-center'>
                  <Image
                    width={20}
                    height={20}
                    className='m-0'
                    src='https://tuk-cdn.s3.amazonaws.com/can-uploader/right_aligned_with_searchbar_Svg4.svg'
                    alt='icon'
                  />
                  <input
                    aria-label='Doctor name'
                    className='w-24 xl:w-32 leading-none tracking-normal text-gray-800 ml-2.5 placeholder-black'
                    placeholder='Doctor Name'
                  />
                </div>
                <div className='flex items-center sm:mx-4 xl:mx-14 lg:my-0'>
                  <Image
                    width={20}
                    className='m-0'
                    height={20}
                    src='https://tuk-cdn.s3.amazonaws.com/can-uploader/right_aligned_with_searchbar_Svg5.svg'
                    alt='icon'
                  />
                  <input
                    aria-label='zip code'
                    className='w-24 xl:w-32 leading-none tracking-normal text-gray-800 ml-2.5 placeholder-black'
                    placeholder='Zip code'
                  />
                </div>
                <div className='flex items-center'>
                  <Image
                    className='m-0'
                    width={20}
                    height={20}
                    src='https://tuk-cdn.s3.amazonaws.com/can-uploader/right_aligned_with_searchbar_Svg6.svg'
                    alt='icon'
                  />
                  <input
                    aria-label='insurance'
                    className='w-24 xl:w-32 leading-none tracking-normal text-gray-800 ml-2.5 placeholder-black'
                    placeholder='Insurance'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <style>
      {`
            /* Top menu */
            .top-100 {
                animation: slideDown 0.5s ease-in-out;
            }
            @keyframes slideDown {
                0% {
                    top: -50%;
                }
                100% {
                    top: 0;
                }
            }
            * {
                outline: none !important;
                -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
                -webkit-tap-highlight-color: transparent;
            }`}
    </style>
  </div>
);

export default Hero;
