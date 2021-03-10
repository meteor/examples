# Meteor + Chakra UI + Dark mode example

## Chakra UI

The setup is already done in this project, but if you want to do it in another project you can follow the steps below.

They are pretty much the same as the recommended on the [installation page](https://chakra-ui.com/docs/getting-started) of Chakra UI.

### 1 - Install npm dependencies
```bash
npm i @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

### 2 - Install Chakra UI icons

```bash
npm i @chakra-ui/icons
```

See [package.json](package.json) as example.

### 3 - Setup Chakra UI Provider + Color Mode

```js
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { App } from '/imports/ui/App';
import { ColorModeScript } from "@chakra-ui/react"
import theme from "./theme";

Meteor.startup(() => {
  render(<>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App/>
  </>, document.getElementById('react-target'));
});

```

See [main.js](client/main.js) and [theme.js](client/theme.js) as example.

## Running the example

### Install dependencies

```bash
meteor npm install
```

### Running

```bash
meteor
```

Video demo:
https://www.loom.com/share/ec3df7366b6048ad8db2f0b4ccbb32c6
