import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import _ from 'lodash';
import { Parties } from '../api/parties/collection';
import { displayName, attending } from '../api/parties/helpers';

Template.details.helpers({
  party: function () {
    return Parties.findOne(Session.get("selected"));
  },
  anyParties: function () {
    return Parties.find().count() > 0;
  },
  creatorName: function () {
    const owner = Meteor.users.findOne(this.owner);
    if (owner._id === Meteor.userId())
      return "me";
    return displayName(owner);
  },
  canRemove: function () {
    return this.owner === Meteor.userId() && attending(this) === 0;
  },
  rsvpBtnClass: function (what) {
    const myRsvp = _.find(this.rsvps, function (r) {
      return r.user === Meteor.userId();
    }) || {};
    return what === myRsvp.rsvp ? "rsvp-active-" + what : "";
  }
});

Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    Session.set("showInviteDialog", true);
    return false;
  },
  'click .remove': function () {
    Parties.remove(this._id);
    return false;
  }
});
