const { defineConfig } = require("@meteorjs/rspack");
const sveltePreprocess = require("svelte-preprocess");

module.exports = defineConfig((Meteor) => {
  return {
    ...(Meteor.isClient && {
      resolve: {
        extensions: [".mjs", ".js", ".ts", ".svelte", ".svelte.js", ".json"],
        mainFields: ["svelte", "browser", "module", "main"],
        conditionNames: ["svelte", "browser", "import", "module", "default"],
        fullySpecified: false,
      },
      module: {
        rules: [
          {
            test: /\.svelte$/,
            use: [
              {
                loader: "svelte-loader",
                options: {
                  compilerOptions: { dev: !Meteor.isProduction },
                  emitCss: Meteor.isProduction,
                  hotReload: !Meteor.isProduction,
                  preprocess: sveltePreprocess({
                    sourceMap: !Meteor.isProduction,
                    postcss: true,
                  }),
                  onwarn(warning, handler) {
                    // Suppress known Skeleton UI library warnings
                    if (warning.code === 'state_referenced_locally') return;
                    handler(warning);
                  },
                },
              },
            ],
          },
          {
            test: /\.svelte\.js$/,
            use: [
              {
                loader: "svelte-loader",
                options: {
                  compilerOptions: { dev: !Meteor.isProduction },
                  emitCss: false,
                  onwarn(warning, handler) {
                    if (warning.code === 'state_referenced_locally') return;
                    handler(warning);
                  },
                },
              },
            ],
          },
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false,
            },
          },
        ],
      },
    }),
  };
});
