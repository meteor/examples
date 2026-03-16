const { defineConfig } = require("@meteorjs/rspack");
const sveltePreprocess = require("svelte-preprocess");

module.exports = defineConfig((Meteor) => {
  return {
    ...(Meteor.isClient && {
      resolve: {
        extensions: [".mjs", ".js", ".ts", ".svelte", ".json"],
        mainFields: ["svelte", "browser", "module", "main"],
        conditionNames: ["svelte", "browser", "import", "module", "default"],
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
                },
              },
            ],
          },
        ],
      },
    }),
  };
});
