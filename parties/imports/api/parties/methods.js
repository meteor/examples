import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import _ from 'lodash';
import { Parties } from './collection';
import { NonEmptyString, Coordinate, contactEmail } from './helpers';

Meteor.methods({
  // options should include: title, description, x, y, public
  createParty: async function (options) {
    check(options, {
      title: NonEmptyString,
      description: NonEmptyString,
      x: Coordinate,
      y: Coordinate,
      public: Match.Optional(Boolean),
    });

    if (options.title.length > 100)
      throw new Meteor.Error(413, "Title too long");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description too long");
    if (!this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    const doc = {
      owner: this.userId,
      x: options.x,
      y: options.y,
      title: options.title,
      description: options.description,
      public: !!options.public,
      invited: [],
      rsvps: []
    };

    if (Meteor.isServer) {
      return await Parties.insertAsync(doc);
    } else {
      return Parties.insert(doc);
    }
  },

  invite: async function (partyId, userId) {
    check(partyId, String);
    check(userId, String);

    const party = Meteor.isServer
      ? await Parties.findOneAsync(partyId)
      : Parties.findOne(partyId);

    if (!party || party.owner !== this.userId)
      throw new Meteor.Error(404, "No such party");
    if (party.public)
      throw new Meteor.Error(400,
                             "That party is public. No need to invite people.");
    if (userId !== party.owner && !_.includes(party.invited, userId)) {
      if (Meteor.isServer) {
        await Parties.updateAsync(partyId, { $addToSet: { invited: userId } });

        const fromUser = await Meteor.users.findOneAsync(this.userId);
        const toUser = await Meteor.users.findOneAsync(userId);
        const from = contactEmail(fromUser);
        const to = contactEmail(toUser);
        if (to) {
          Email.send({
            from: "noreply@example.com",
            to: to,
            replyTo: from || undefined,
            subject: "PARTY: " + party.title,
            text:
"Hey, I just invited you to '" + party.title + "' on All Tomorrow's Parties." +
"\n\nCome check it out: " + Meteor.absoluteUrl() + "\n"
          });
        }
      } else {
        Parties.update(partyId, { $addToSet: { invited: userId } });
      }
    }
  },

  rsvp: async function (partyId, rsvp) {
    check(partyId, String);
    check(rsvp, String);
    if (!this.userId)
      throw new Meteor.Error(403, "You must be logged in to RSVP");
    if (!['yes', 'no', 'maybe'].includes(rsvp))
      throw new Meteor.Error(400, "Invalid RSVP");

    const party = Meteor.isServer
      ? await Parties.findOneAsync(partyId)
      : Parties.findOne(partyId);

    if (!party)
      throw new Meteor.Error(404, "No such party");
    if (!party.public && party.owner !== this.userId &&
        !party.invited?.includes(this.userId))
      // private, but let's not tell this to the user
      throw new Meteor.Error(403, "No such party");

    const rsvpIndex = party.rsvps.map(rsvps => rsvps.user).indexOf(this.userId);
    if (rsvpIndex !== -1) {
      // update existing rsvp entry
      if (Meteor.isServer) {
        await Parties.updateAsync(
          {_id: partyId, "rsvps.user": this.userId},
          {$set: {"rsvps.$.rsvp": rsvp}});
      } else {
        // minimongo doesn't yet support $ in modifier. as a temporary
        // workaround, make a modifier that uses an index. this is
        // safe on the client since there's only one thread.
        let modifier = {$set: {}};
        modifier.$set["rsvps." + rsvpIndex + ".rsvp"] = rsvp;
        Parties.update(partyId, modifier);
      }
    } else {
      // add new rsvp entry
      if (Meteor.isServer) {
        await Parties.updateAsync(partyId,
                       {$push: {rsvps: {user: this.userId, rsvp: rsvp}}});
      } else {
        Parties.update(partyId,
                       {$push: {rsvps: {user: this.userId, rsvp: rsvp}}});
      }
    }
  }
});
