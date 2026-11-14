import { Template } from 'meteor/templating';

import './main.html';
import '/imports/ui/tasks';
import '/imports/ui/admin';

// Two pages, chosen by path; links do a full navigation, no router needed.
Template.layout.helpers({
  isAdminRoute: () => window.location.pathname.startsWith('/admin'),
});
