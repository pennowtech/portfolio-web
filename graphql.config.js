// graphql.config.js
module.exports = {
  projects: {
    app: {
      schema: ['https://pennow.tech/graphql'],
      extensions: {
        endpoints: {
          default: {
            url: 'https://pennow.tech/graphql',

          },
        },
      },
    },
    db: {
      schema: 'src/generated/db.graphql',
      documents: ['src/db/**/*.graphql', 'my/fragments.graphql'],
      extensions: {
        codegen: [
          {
            generator: 'graphql-binding',
            language: 'typescript',
            output: {
              binding: 'src/generated/db.ts',
            },
          },
        ],
        endpoints: {
          default: {
            url: 'https://pennow.tech/graphql',
            headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
          },
        },
      },
    },
  },
};
