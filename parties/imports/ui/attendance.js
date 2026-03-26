import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import _ from 'lodash';
import { Parties } from '../api/parties/collection';
import { displayName } from '../api/parties/helpers';

Template.attendance.helpers({
  rsvpName: function () {
    const user = Meteor.users.findOne(this.user);
    return displayName(user);
  },

  outstandingInvitations: function () {
    const party = Parties.findOne(this._id);
    return Meteor.users.find({$and: [
        {_id: {$in: party.invited}}, // they're invited
        {_id: {$nin: _.map(party.rsvps, 'user')}} // but haven't RSVP'd
      ]});
  },

  invitationName: function () {
    return displayName(this);
  },

  rsvpIs: function (what) {
    return this.rsvp === what;
  },

  nobody: function () {
    return !this.public && (this.rsvps.length + this.invited.length === 0);
  },

  canInvite: function () {
    return !this.public && this.owner === Meteor.userId();
  }
});
