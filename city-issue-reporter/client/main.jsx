import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';
import Framework7 from 'framework7/lite-bundle';
import Framework7React from 'framework7-react';
import 'framework7/css/bundle';
import App from '../imports/ui/App';
import { bootNativeRuntime } from '../imports/ui/native/boot';
import '../imports/api/reports/collection';
import '../imports/api/reports/methods';
import './main.css';

Framework7.use(Framework7React);

Meteor.startup(() => {
  void bootNativeRuntime();
  createRoot(document.getElementById('react-target')).render(<App />);
});
