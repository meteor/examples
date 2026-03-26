import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.page.helpers({
  showCreateDialog: function () {
    return Session.get("showCreateDialog");
  },
  showInviteDialog: function () {
    return Session.get("showInviteDialog");
  }
});
