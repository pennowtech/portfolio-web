// graphql.config.js
module.exports = {
  projects: {
    app: {
      schema: ['https://wordpress-561320-2383780.cloudwaysapps.com/graphql'],
      extensions: {
        endpoints: {
          default: {
            url: 'https://wordpress-561320-2383780.cloudwaysapps.com/graphql',

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
            url: 'https://wordpress-561320-2383780.cloudwaysapps.com/graphql',
            headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
          },
        },
      },
    },
  },
};
