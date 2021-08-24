import { Meteor } from 'meteor/meteor';
import { Parties } from '../imports/model';

Meteor.publish("directory", () => {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
});

Meteor.publish("parties", () => {
  return Parties.find(
    {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});

Meteor.startup(() => {
  // code to run on server at startup
});
