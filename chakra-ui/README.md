# Meteor + Chakra UI + Dark mode example

Demo deployed on [Galaxy](https://meteor.com/cloud):

https://chakraui.meteorapp.com/

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
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';
import { HeroCallToAction } from './HeroCallToAction';
import { Navbar } from './Navbar';

const theme = extendTheme({ config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  } });

export const App = () => (
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <Navbar />
      <HeroCallToAction />
    </ChakraProvider>
  </>
);

```

See [main.js](client/main.js) and [App.js](imports/ui/App.js) as example.

## Running the example

### Install dependencies

```bash
meteor npm install
```

### Running

```bash
meteor npm run start
```
