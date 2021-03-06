import React from 'react';
import { ChakraProvider } from "@chakra-ui/react"
import HeroCallToAction from "./HeroCallToAction";
import Navbar from "./Navbar";
import theme from "../../client/theme";

export const App = () => (
  <ChakraProvider theme={theme}>
    <Navbar />
    <HeroCallToAction />
  </ChakraProvider>
);
