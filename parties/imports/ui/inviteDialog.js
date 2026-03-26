import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Parties } from '../api/parties/collection';
import { displayName } from '../api/parties/helpers';

Template.inviteDialog.events({
  'click .invite': function (event, template) {
    Meteor.call('invite', Session.get("selected"), this._id);
  },
  'click .done': function (event, template) {
    Session.set("showInviteDialog", false);
    return false;
  }
});

Template.inviteDialog.helpers({
  uninvited: function () {
    const party = Parties.findOne(Session.get("selected"));
    if (!party)
      return []; // party hasn't loaded yet
    return Meteor.users.find({$nor: [{_id: {$in: party.invited}},
        {_id: party.owner}]});
  },

  displayName: function () {
    return displayName(this);
  }
});
