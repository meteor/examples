import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';

// Import collection + offline config (must be on client for jam:offline)
import '../imports/api/notes/collection';
// Import methods on client for optimistic UI + jam:method offline queuing
import '../imports/api/notes/methods';

import { App } from '../imports/ui/App';
import './main.css';

Meteor.startup(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  const root = createRoot(document.getElementById('app'));
  root.render(<App />);
});
