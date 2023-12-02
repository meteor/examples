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
