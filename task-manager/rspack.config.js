const { defineConfig } = require('@meteorjs/rspack');
const path = require('path');

module.exports = defineConfig(Meteor => {
  const compiled = Meteor.compileWithRspack(['meteor-rpc'], {
    jsc: {
      parser: { syntax: 'typescript' },
      externalHelpers: false,
    },
  });

  return {
    ...compiled,
    ignoreWarnings: [/ESModulesLinkingWarning/],
    resolve: {
      ...compiled.resolve,
      alias: {
        ...compiled.resolve?.alias,
        '@': path.resolve(__dirname, 'imports'),
        '@swc/helpers/_': path.resolve(__dirname, 'node_modules/@swc/helpers/esm'),
      },
      modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
      conditionNames: ['module-sync', 'webpack', 'import', 'default'],
    },
    module: {
      ...compiled.module,
      rules: [
        ...(compiled.module?.rules || []),
        Meteor.isClient && {
          test: /\.css$/,
          use: ['postcss-loader'],
          type: 'css',
        },
      ].filter(Boolean),
    },
  };
});
