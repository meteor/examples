import './main.css';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../imports/ui/App';

Meteor.startup(() => {
  const rootNode = document.getElementById('react-target');

  if (!rootNode) {
    throw new Error('Missing #react-target mount node');
  }

  createRoot(rootNode).render(<App />);
});
