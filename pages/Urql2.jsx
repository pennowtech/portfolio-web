import React, { useEffect } from 'react';
import { useQuery, useMutation } from 'urql';
import gql from 'graphql-tag';
import { useAlert } from 'react-alert';
import { setToken, deleteToken, getToken } from '../utils/token';
import PostUrql from './post_urql';

const QueryString = gql`
query Posts($id: ID!)
{
  post(id: $id, idType: DATABASE_ID) {
    id
    databaseId
    title
    uri
    categories {
      nodes {
        id
        name
        uri
      }
    }

  }
}
    `;
// password: "eTR8b5AHG7"
// password: "Pa85M29ErY"

const LoginUser = gql`
mutation LoginUser($username: String!, $password: String!) {
  login( input: {
    clientMutationId: "uniqueId",
    username: $username,
    password: $password
  } ) {
    authToken
    user {
      id
      name
    }
  }
}`;

const createPostString = gql`
mutation CREATE_POST($title: String!, $content: String!) {
  createPost(input: {
    clientMutationId: "CreatePost"
    title: $title
    content: $content
    status: PUBLISH
  }) {
    post {
      id
      title
      date
    }
  }
}
    `;

const WeatherQuery = gql`
query TorontoWeather($city: String!) {
  getCityByName(name: $city) {
    id
    name
    weather {
      summary {
        title
        description
      }
      temperature {
        min
        max
        actual
      }
    }
  }
}
`;
// `, { first: 5 });
const Urql2 = () => {
  const alert = useAlert();
  const [isLogin, setIsLogin] = React.useState(false);
  useEffect(() => {
    setIsLogin(!!getToken());
  }, []);

  const data_2 = {
    query: QueryString,
    variables: { id: '4' },
  };
  const data_3 = {
    query: createPostString,
  };

  //------------------------
  const [res, executeLoginUser] = useMutation(LoginUser);
  const executeLogin = React.useCallback(() => {
    executeLoginUser({
      username: 'sdsingh.developer@gmail.com',
      password: 'eTR8b5AHG7',
    })
      .then((result) => {
        if (result.error) {
          alert.error(<div className="capitalize">{result.error.message}</div>);
          console.error('Oh no!', result.error.message);
        }
        const token = result.data?.login?.authToken;
        if (token) {
          setToken(token);
          setIsLogin(true);
          // return <Redirect to="/" />;
          // history.push('/');
        }
        console.log(token);
      });
  }, [executeLoginUser]);
  //------------------------
  const [res2, executePostCreation] = useMutation(createPostString);
  const CreatePost = React.useCallback(() => {
    // executePostCreation()
    executePostCreation({ title: 'New Course!', content: 'Dummy' })
      .then((result) => {
        console.log(result);
        if (result.error) {
          alert.error(<div className="capitalize">{result.error.message}</div>);
          console.error('Oh no!', result.error.message);
        }
      });
  }, [executePostCreation]);

  //------------------------
  const executeLogout = () => {
    deleteToken();
    setIsLogin(false);
  };

  //------------------------
  const [result, getPosts] = useQuery(data_2);
  const { data, fetching, error } = result;
  if (fetching) return <div>Fetching</div>;
  if (error) console.log(error);
  console.log(32, data);

  const GetPost = () => {
    console.log(23, getPosts({ requestPolicy: 'cache-and-network' }));
  };
  //------------------------
  return (
    <div>
      <button
        type="button"
        className="pointer mr2 button"
      // disabled={state.fetching}
        onClick={GetPost}
      >
        Get Post
      </button>
      {' '}
      <button
        type="button"
        className="pointer mr2 button"
      // disabled={state.fetching}
        onClick={CreatePost}
      >
        Create Post
      </button>
      {isLogin ? (
        <button
          type="button"
          className="pointer mr2 button"
      // disabled={state.fetching}
          onClick={executeLogout}
        >
          Logout
        </button>
      ) : (
        <button
          type="button"
          className="pointer mr2 button"
      // disabled={state.fetching}
          onClick={executeLogin}
        >
          Login
        </button>
      )}
      <PostUrql />
    </div>
  );
};
export default Urql2;
