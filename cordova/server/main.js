import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import '/imports/api/contacts';
import '../imports/infra/meta-tags';
import { pwaJson } from '../imports/infra/pwa-json';
import { appleAppSiteAssociation } from '../imports/infra/apple-app-site-association';

// Wire up JSON endpoints directly (no Express needed)
WebApp.connectHandlers.use('/pwa.json', Meteor.bindEnvironment(pwaJson));
WebApp.connectHandlers.use(
  '/apple-app-site-association',
  Meteor.bindEnvironment(appleAppSiteAssociation)
);

// Warn about missing settings
Meteor.startup(() => {
  const pub = Meteor.settings && Meteor.settings.public;
  if (!pub || !pub.native) {
    console.warn(
      '[Contacts] No native settings found. ' +
      'Run with --settings private/env/dev/settings.json to configure PWA manifest and store links.'
    );
  }
});
