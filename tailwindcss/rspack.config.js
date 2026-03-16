const { defineConfig } = require('@meteorjs/rspack');

module.exports = defineConfig(Meteor => {
  return {
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
