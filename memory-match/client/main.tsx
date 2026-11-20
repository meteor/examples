import { Meteor } from 'meteor/meteor';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '../imports/ui/App';
import './main.css';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  if (!container) throw new Error('Missing #react-target application mount');
  createRoot(container).render(<App />);
});
