import assert from "assert";
import { Meteor } from "meteor/meteor";

describe("parties", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    assert.strictEqual(name, "parties");
  });

  if (Meteor.isClient) {
    it("client is not server", function () {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it("server is not client", function () {
      assert.strictEqual(Meteor.isClient, false);
    });

    describe("Parties collection", function () {
      it("inserts and retrieves a party", async function () {
        const { Parties } = await import("/imports/api/parties/collection");
        const partyId = await Parties.insertAsync({
          owner: "test-user",
          title: "Test Party",
          description: "A test party",
          x: 0.5,
          y: 0.5,
          public: true,
          invited: [],
          rsvps: [],
        });

        const party = await Parties.findOneAsync(partyId);
        assert.strictEqual(party.title, "Test Party");
        assert.strictEqual(party.public, true);
        assert.deepStrictEqual(party.rsvps, []);

        await Parties.removeAsync(partyId);
      });
    });

    describe("RSVP behavior", function () {
      it("stores rsvp in the party document", async function () {
        const { Parties } = await import("/imports/api/parties/collection");
        const partyId = await Parties.insertAsync({
          owner: "test-user",
          title: "RSVP Party",
          description: "Testing RSVP",
          x: 0.5,
          y: 0.5,
          public: true,
          invited: [],
          rsvps: [{ user: "user-1", rsvp: "yes" }],
        });

        const party = await Parties.findOneAsync(partyId);
        assert.strictEqual(party.rsvps.length, 1);
        assert.strictEqual(party.rsvps[0].user, "user-1");
        assert.strictEqual(party.rsvps[0].rsvp, "yes");

        await Parties.removeAsync(partyId);
      });
    });

    describe("attending helper", function () {
      it("counts yes RSVPs correctly", async function () {
        const { attending } = await import("/imports/api/parties/helpers");
        const party = {
          rsvps: [
            { user: "a", rsvp: "yes" },
            { user: "b", rsvp: "no" },
            { user: "c", rsvp: "yes" },
            { user: "d", rsvp: "maybe" },
          ],
        };
        assert.strictEqual(attending(party), 2);
      });
    });
  }
});
