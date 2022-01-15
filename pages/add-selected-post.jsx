import { useState } from "react";

export default function AddPost() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handlePost = async (e) => {
    e.preventDefault();
    setLoading(true);

    // reset error and message
    setError("");
    setMessage("");

    // fields check
    if (!title || !content) return setError("All fields are required");

    // post structure
    let post = {
      title,
      content,
      published: false,
      createdAt: new Date().toISOString(),
    };
    // save the post
    let response = await fetch("/api/selectedposts", {
      method: "POST",
      body: JSON.stringify(post),
    });

    // get the data
    let data = await response.json();
    setLoading(false);

    if (data.success) {
      // reset the fields
      setTitle("");
      setContent("");
      // set the message
      return setMessage(data.message);
    } else {
      // set the error
      return setError(data.message);
    }
  };

  return (
    <div>
      <div className="">
        <form onSubmit={handlePost} className="">
          {error ? (
            <div className="">
              <h3 className="">{error}</h3>
            </div>
          ) : null}
          {message ? (
            <div className="">
              <h3 className="">{message}</h3>
            </div>
          ) : null}
          <div className="">
            <label>Title</label>
            <input
              type="text"
              name="title"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
              placeholder="title"
            />
          </div>
          <div className="">
            <label>Content</label>
            <textarea
              name="content"
              onChange={(e) => setContent(e.target.value)}
              value={content}
              placeholder="Post content"
            />
          </div>
          <div className="">
            <button type="submit" disabled={loading ? true : false}>
              {loading ? "Adding Post" : "Add Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// export async function getServerSideProps(context) {
//   let res = await fetch("http://localhost:3000/api/selectedposts", {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
//   let posts = await res.json();

//   return {
//     props: { posts },
//   };
// }
