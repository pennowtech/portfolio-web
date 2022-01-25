import connectToDatabase from '../../utils/mongodb';

async function getSelectedPosts(db, req, res) {
  try {
    // fetch the posts
    const posts = await db
      .collection('selected-posts')
      .find({})
      .sort({ published: -1 })
      .toArray();
    console.log(23, JSON.stringify(posts));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'max-age=180000');
    res.end(JSON.stringify(posts));
    // return the posts
    // res.json({
    //   message: JSON.parse(JSON.stringify(posts)),
    //   success: true,
    // });
  } catch (error) {
    // return the error
    return res.json({
      message: new Error(error).message,
      success: false,
    });
  }
}

const addSelectedPosts = async (db, req, res) => {
  try {
    // add the post
    await db.collection('selected-posts').insertOne(JSON.parse(req.body));
    // return a message
    return res.json({
      message: 'Post added successfully',
      success: true,
    });
  } catch (error) {
    // return an error
    return res.json({
      message: new Error(error).message,
      success: false,
    });
  }
};

const updateSelectedPosts = async (db, req, res) => '';

const deleteSelectedPosts = async (db, req, res) => '';

export default async function handler(req, res) {
  const client = await connectToDatabase;
  const db = client.db(process.env.DB_NAME);
  // connect to the database
  // const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      getSelectedPosts(db, req, res);
      break;
    case 'POST':
      addSelectedPosts(db, req, res);
      break;
    case 'PUT':
      updateSelectedPosts(db, req, res);
      break;
    case 'DELETE':
      deleteSelectedPosts(db, req, res);
      break;
    default:
      break;
  }
}
