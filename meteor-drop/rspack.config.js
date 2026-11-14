const { defineConfig } = require('@meteorjs/rspack');

module.exports = defineConfig((Meteor) => {
  if (!Meteor.isClient) {
    return {};
  }

  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          type: 'css/auto',
          use: ['postcss-loader'],
        },
      ],
    },
    ...(Meteor.isNative ? {
      output: {
        publicPath: '/app/',
      },
    } : {}),
  };
});
