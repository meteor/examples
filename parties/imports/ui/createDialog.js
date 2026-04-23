import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.createDialog.events({
  'click .save': function (event, template) {
    const title = template.find(".title").value;
    const description = template.find(".description").value;
    const isPublic = !template.find(".private").checked;
    const coords = Session.get("createCoords");

    if (title.length && description.length) {
      Meteor.call('createParty', {
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: isPublic
      }, function (error, id) {
        if (id) {
          Session.set("selected", id);
          if (!isPublic && Meteor.users.find().count() > 1)
            Session.set("showInviteDialog", true);
        }
      });
      Session.set("showCreateDialog", false);
    } else {
      Session.set("createError",
        "It needs a title and a description, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  }
});

Template.createDialog.helpers({
  error: function () {
    return Session.get("createError");
  }
});
