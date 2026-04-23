import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

export const ContactsCollection = new Mongo.Collection('contacts');

if (Meteor.isServer) {
  Meteor.publish('contacts', function () {
    if (!this.userId) return this.ready();
    return ContactsCollection.find({ userId: this.userId });
  });
}

const OptionalString = Match.Maybe(String);

Meteor.methods({
  async 'contacts.insert'({ firstName, lastName, phone, email, company, notes, favorite }) {
    check(firstName, String);
    check(lastName, OptionalString);
    check(phone, OptionalString);
    check(email, OptionalString);
    check(company, OptionalString);
    check(notes, OptionalString);
    check(favorite, Match.Maybe(Boolean));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!firstName.trim()) throw new Meteor.Error('invalid', 'First name is required');

    return ContactsCollection.insertAsync({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
      company: (company || '').trim(),
      notes: (notes || '').trim(),
      favorite: favorite || false,
      userId: this.userId,
      createdAt: new Date(),
    });
  },

  async 'contacts.update'({ _id, ...fields }) {
    check(_id, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const contact = await ContactsCollection.findOneAsync(_id);
    if (!contact || contact.userId !== this.userId) throw new Meteor.Error('not-authorized');

    const allowed = ['firstName', 'lastName', 'phone', 'email', 'company', 'notes', 'favorite'];
    const update = {};
    for (const key of allowed) {
      if (key in fields) {
        update[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key];
      }
    }
    if ('firstName' in update && !update.firstName) {
      throw new Meteor.Error('invalid', 'First name is required');
    }

    await ContactsCollection.updateAsync(_id, { $set: update });
  },

  async 'contacts.remove'({ _id }) {
    check(_id, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const contact = await ContactsCollection.findOneAsync(_id);
    if (!contact || contact.userId !== this.userId) throw new Meteor.Error('not-authorized');

    await ContactsCollection.removeAsync(_id);
  },

  async 'contacts.toggleFavorite'({ _id }) {
    check(_id, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const contact = await ContactsCollection.findOneAsync(_id);
    if (!contact || contact.userId !== this.userId) throw new Meteor.Error('not-authorized');

    await ContactsCollection.updateAsync(_id, { $set: { favorite: !contact.favorite } });
  },
});
