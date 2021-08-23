# tailwind Meteor example

## Tailwind setup

The setup is already done in this project, but if you want to do it in another project you can follow the steps below.

They are very similar to the recommendation in the [installation page](https://tailwindcss.com/docs/installation) of Tailwind.

### 1 - Install npm dependencies
```bash
meteor npm install tailwindcss@latest postcss@latest postcss-load-config@latest autoprefixer@latest
```
See [package.json](package.json) as example.

### 2 - Install Meteor package for postcss

And remove the standard minifier.

```bash
meteor remove standard-minifier-css
meteor add juliancwirko:postcss
```

See [packages](.meteor/packages) as example.

### 3 - Configure postcss

See [.postcssrc.js](.postcssrc.js) as example.

### 4 - Include Tailwind in your CSS

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
See [main.css](client/main.css) as example.

### 5 - Configure Tailwind

See [tailwind.config.js](tailwind.config.js) as example.

## Running the example

### Install dependencies

```bash
meteor npm install
```

### Running

```bash
meteor
```

> You will see some warnings when running this example, but we are going to [fix](https://github.com/Meteor-Community-Packages/organization/issues/52) them soon
