import { CREATE_POST } from 'queries/queries';
import { gqlAuthClient } from '../../utils/gqlclient';

const CreatePost = async (req, res) => {
  // add the post
  const createResult = await gqlAuthClient().mutation(CREATE_POST, {
    title: 'New Course!', content: 'Dummy', description: 'excerpt', slug: 'slug-1', tag: 'tag-1', cat: 'cat-1',
  })
    .toPromise();
    // .then((result) => {
    //   if (result.error) { console.log(33, result.error.message); }
    // });
  // return a message
  console.error(33, createResult.error.message);
  res.status(200).json({
    message: 'Post added successfully',
    success: true,
  });
};

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      CreatePost(req.body, res);
      break;
    case 'PUT':
      console.warn(req.method);
      break;
    case 'DELETE':
      console.warn(req.method);
      break;
    default:
      break;
  }
}
