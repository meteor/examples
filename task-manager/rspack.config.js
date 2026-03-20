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
      modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
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
