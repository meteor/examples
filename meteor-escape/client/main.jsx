import './main.css';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../imports/ui/App';
import { bootNativeRuntime } from '../imports/ui/native/boot';

Meteor.startup(() => {
  const rootNode = document.getElementById('react-target');

  if (!rootNode) {
    throw new Error('Missing #react-target mount node');
  }

  void bootNativeRuntime();
  createRoot(rootNode).render(<App />);
});
