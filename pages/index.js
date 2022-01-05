import Head from 'next/head';
import { Element } from 'react-scroll';
import 'tailwindcss/tailwind.css'

import { Navbar } from '../components/Navbar';

const Home = () => {
    return (
        <div className='w-full'>
        <div className=' mx-auto min-h-screen md:max-w-screen-lg xl:max-w-[1167px] shadow-sm '>
            <Head>
                <title>My Personal Blog</title>
                <meta name='description' content='My personal Blog on modern software technologies' />
                <link rel='icon' href='/favicon.ico' />
            </Head>
            <Navbar />
            <h1 className="text-3xl font-bold underline items-center text-green-500">
                Hello world!
            </h1>
            <Element name="Market" className="element min-h-[1500px]" >
            test 1
        </Element>

        <Element name="Exchange" className="element min-h-[1500px]">
            test 2
        </Element>
        <Element name="Tutorials" className="element min-h-[1500px]">
            test 3
        </Element>
        </div>
        </div>
    )
}

export default Home;