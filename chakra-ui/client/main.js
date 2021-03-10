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
