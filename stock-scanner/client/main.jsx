import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '../imports/ui/native/hcpReloadGate.client';
import App from '../imports/ui/App';
import { bootNativeRuntime } from '../imports/ui/native/boot';
import { stockTheme } from '../imports/ui/theme';
import './main.css';

Meteor.startup(() => {
  void bootNativeRuntime();

  createRoot(document.getElementById('react-target')).render(
    <ThemeProvider theme={stockTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
});
