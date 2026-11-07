const { defineConfig } = require('@meteorjs/rspack');

module.exports = defineConfig((Meteor) => {
  if (!Meteor.isClient) {
    return {};
  }

  if (!Meteor.isNative) {
    return {};
  }

  return {
    output: {
      publicPath: '/app/',
    },
  };
});
