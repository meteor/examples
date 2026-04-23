import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '@lingui/react';

// Import collection + offline config (must be on client for jam:offline)
import '../imports/api/notes/collection';
// Import methods on client for optimistic UI + jam:method offline queuing
import '../imports/api/notes/methods';

import { App } from '../imports/ui/App';
import { i18n, activateLocale, detectLocale } from '../imports/ui/i18n';
import './main.css';

Meteor.startup(async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  await activateLocale(detectLocale());

  const root = createRoot(document.getElementById('app'));
  root.render(
    <I18nProvider i18n={i18n}>
      <App />
    </I18nProvider>
  );
});
