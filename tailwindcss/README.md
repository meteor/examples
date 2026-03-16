# Tailwind CSS Meteor Example

A Meteor 3.4 example app using Tailwind CSS with Rspack as the bundler.

## Tailwind Setup

The setup is already done in this project, but if you want to do it in another project you can follow the steps below.

They are very similar to the recommendation in the [official Rspack + Tailwind guide](https://tailwindcss.com/docs/installation/framework-guides/rspack/react).

> You can also use `meteor create --tailwind` to start with a preconfigured Rspack Tailwind app.

### 1 - Install npm dependencies

```bash
meteor npm install tailwindcss postcss autoprefixer postcss-loader
```

See [package.json](package.json) as example.

### 2 - Add the Rspack package

```bash
meteor add rspack
```

On first run, the package installs the required Rspack dependencies automatically.

See [.meteor/packages](.meteor/packages) as example.

### 3 - Configure PostCSS

See [postcss.config.js](postcss.config.js) as example.

### 4 - Configure Tailwind

See [tailwind.config.js](tailwind.config.js) as example.

### 5 - Include Tailwind in your CSS

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

See [main.css](client/main.css) as example.

Import the CSS file from your client entry point:

```js
import './main.css';
```

See [client/main.jsx](client/main.jsx) as example.

### 6 - Configure Rspack to use PostCSS

Enable the PostCSS loader in your `rspack.config.js` so Rspack processes Tailwind directives:

```js
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
```

See [rspack.config.js](rspack.config.js) as example.

### 7 - Add a `.meteorignore` file

Prevent Meteor from processing the CSS file directly (let Rspack handle it instead):

```
client/main.css
```

See [.meteorignore](.meteorignore) as example.

## Running the example

### Install dependencies

```bash
meteor npm install
```

### Running

```bash
meteor
```
