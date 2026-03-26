import { Mongo } from 'meteor/mongo';
import { attending } from './helpers';

/*
  Each party is represented by a document in the Parties collection:
    owner: user id
    x, y: Number (screen coordinates in the interval [0, 1])
    title, description: String
    public: Boolean
    invited: Array of user id's that are invited (only if !public)
    rsvps: Array of objects like {user: userId, rsvp: "yes"} (or "no"/"maybe")
*/
export const Parties = new Mongo.Collection("parties");

Parties.allow({
  insert: function (userId, party) {
    return false; // no cowboy inserts -- use createParty method
  },
  update: function (userId, party, fields, modifier) {
    if (userId !== party.owner)
      return false; // not the owner

    const allowed = ["title", "description", "x", "y"];
    if ([fields, allowed].reduce((a, b) => a.filter(c => !b.includes(c))).length)
      return false; // tried to write to forbidden field

    return true;
  },
  remove: function (userId, party) {
    // You can only remove parties that you created and nobody is going to.
    return party.owner === userId && attending(party) === 0;
  }
});
