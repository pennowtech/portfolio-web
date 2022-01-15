import { ApolloServer, gql } from 'apollo-server-micro'
// import { makeExecutableSchema } from 'graphql-tools'
import { MongoClient } from 'mongodb'


const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.DB_NAME;

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String!
    published: String
    createdAt: Int
  }

  type Query {
    posts: [Post]!
  }
`

const resolvers = {
  Query: {
    users(_parent, _args, _context, _info) {
      return _context.db
        .collection('selected-posts')
        .findOne()
        .then((data) => {
          return data.posts
        })
    },
  },
}

const schema = {
  typeDefs,
  resolvers,
}

let db

const apolloServer = new ApolloServer({
  schema,
  context: async () => {
    if (!db) {
      try {
        const dbClient = new MongoClient(MONGODB_URI, options)

        if (!dbClient.isConnected()) await dbClient.connect()
        db = dbClient.db(MONGODB_DB) // database name
      } catch (e) {
        console.log('--->error while connecting via graphql context (db)', e)
      }
    }

    return { db }
  },
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default apolloServer.createHandler({ path: '/api/graphql' })