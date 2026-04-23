import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';

import Framework7 from 'framework7/lite-bundle';
import Framework7React from 'framework7-react';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import 'material-icons/iconfont/material-icons.css';

import '../imports/infra/serviceWorkerInit';

Framework7.use(Framework7React);

import { ContactsApp } from '/imports/ui/App';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  root.render(<ContactsApp />);
});
