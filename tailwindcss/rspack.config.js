const { defineConfig } = require('@meteorjs/rspack');
const path = require('path');

module.exports = defineConfig(Meteor => {
  return {
    ...Meteor.compileWithRspack(['meteor-rpc'], {
      jsc: { parser: { syntax: 'typescript' } },
    }),
    ignoreWarnings: [/ESModulesLinkingWarning/],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'imports'),
      },
    },
    module: {
      rules: [
        Meteor.isClient && {
          test: /\.css$/,
          use: ['postcss-loader'],
          type: 'css/auto',
        },
      ].filter(Boolean),
    },
  };
});
