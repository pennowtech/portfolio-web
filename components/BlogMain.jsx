import Link from "next/link";

export const BlogMain = () => {
  return (
    <div className="mt-3">
      <p className="display-4 text-center">Blogs</p>
      <p className="text-center">A central place for my thoughts and learning</p>
      <Link href="/blogs" passHref>
        <p className="text-center cursor-pointer ms-5 pointer lead my-auto">More Blogs</p>
      </Link>
    </div>
  )
}