import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { check, Match } from "meteor/check";
import _ from "lodash";
// All Tomorrow's Parties -- data model
// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Parties

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
    if (userId !== party.owner) return false; // not the owner

    const allowed = ["title", "description", "x", "y"];
    if (
      [fields, allowed].reduce((a, b) => a.filter((c) => !b.includes(c))).length
    )
      return false; // tried to write to forbidden field

    // A good improvement would be to validate the type of the new
    // value of the field (and if a string, the length.) In the
    // future Meteor will have a schema system to makes that easier.
    return true;
  },
  remove: function (userId, party) {
    // You can only remove parties that you created and nobody is going to.
    return party.owner === userId && attending(party) === 0;
  },
});

export const attending = function (party) {
  return (_.groupBy(party.rsvps, "rsvp").yes || []).length;
};

const NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

const Coordinate = Match.Where(function (x) {
  check(x, Number);
  return x >= 0 && x <= 1;
});

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
    if (!this.userId) throw new Meteor.Error(403, "You must be logged in");

    return await Parties.insertAsync({
      owner: this.userId,
      x: options.x,
      y: options.y,
      title: options.title,
      description: options.description,
      public: !!options.public,
      invited: [],
      rsvps: [],
    });
  },

  invite: async function (partyId, userId) {
    check(partyId, String);
    check(userId, String);
    const party = await Parties.findOneAsync(partyId);
    if (!party || party.owner !== this.userId)
      throw new Meteor.Error(404, "No such party");
    if (party.public)
      throw new Meteor.Error(
        400,
        "That party is public. No need to invite people."
      );
    if (userId !== party.owner && !_.contains(party.invited, userId)) {
      await Parties.updateAsync(partyId, { $addToSet: { invited: userId } });

      const from = contactEmail(await Meteor.users.findOneAsync(this.userId));
      const to = contactEmail(await Meteor.users.findOneAsync(userId));
      if (Meteor.isServer && to) {
        // This code only runs on the server. If you didn't want clients
        // to be able to see it, you could move it to a separate file.
        await Email.sendAsync({
          from: "noreply@example.com",
          to: to,
          replyTo: from || undefined,
          subject: "PARTY: " + party.title,
          text:
            "Hey, I just invited you to '" +
            party.title +
            "' on All Tomorrow's Parties." +
            "\n\nCome check it out: " +
            Meteor.absoluteUrl() +
            "\n",
        });
      }
    }
  },

  rsvp: async function (partyId, rsvp) {
    check(partyId, String);
    check(rsvp, String);
    if (!this.userId)
      throw new Meteor.Error(403, "You must be logged in to RSVP");
    if (!["yes", "no", "maybe"].includes(rsvp))
      throw new Meteor.Error(400, "Invalid RSVP");
    const party = await Parties.findOneAsync(partyId);
    if (!party) throw new Meteor.Error(404, "No such party");
    if (
      !party.public &&
      party.owner !== this.userId &&
      !party.invited?.includes(this.userId)
    )
      // private, but let's not tell this to the user
      throw new Meteor.Error(403, "No such party");

    const rsvpIndex = party.rsvps
      .map((rsvps) => rsvps.user)
      .indexOf(this.userId);
    if (rsvpIndex !== -1) {
      // update existing rsvp entry

      if (Meteor.isServer) {
        // update the appropriate rsvp entry with $
        await Parties.updateAsync(
          { _id: partyId, "rsvps.user": this.userId },
          { $set: { "rsvps.$.rsvp": rsvp } }
        );
      } else {
        // minimongo doesn't yet support $ in modifier. as a temporary
        // workaround, make a modifier that uses an index. this is
        // safe on the client since there's only one thread.
        let modifier = { $set: {} };
        modifier.$set["rsvps." + rsvpIndex + ".rsvp"] = rsvp;
        await Parties.updateAsync(partyId, modifier);
      }

      // Possible improvement: send email to the other people that are
      // coming to the party.
    } else {
      // add new rsvp entry
      await Parties.updateAsync(partyId, {
        $push: { rsvps: { user: this.userId, rsvp: rsvp } },
      });
    }
  },
});

///////////////////////////////////////////////////////////////////////////////
// Users

export const displayName = function (user) {
  if (user.profile?.name) return user.profile.name;
  return user.emails[0].address;
};

export const contactEmail = function (user) {
  if (user.emails?.length) return user.emails[0].address;
  if (user.services?.facebook && user.services?.facebook.email)
    return user.services.facebook.email;
  return null;
};
