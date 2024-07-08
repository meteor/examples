import React from 'react';
import { Meteor } from 'meteor/meteor';
import { App } from '../imports/ui/App';
import { createRoot } from 'react-dom/client';

Meteor.startup(() => {
  const domNode = document.getElementById('react-target');
  const root = createRoot(domNode);
  root.render(<App />);
});
