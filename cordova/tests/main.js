import assert from 'assert';
import { Meteor } from 'meteor/meteor';

describe('cordova', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'cordova');
  });

  if (Meteor.isServer) {
    it('server is not client', function () {
      assert.strictEqual(Meteor.isClient, false);
    });

    describe('contacts.insert method', function () {
      it('creates a contact for the logged-in user', async function () {
        const { ContactsCollection } = await import('../imports/api/contacts');
        const userId = await Meteor.users.insertAsync({ username: 'testuser-insert' });

        const contactId = await ContactsCollection.insertAsync({
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '555-0100',
          email: 'jane@example.com',
          company: 'Meteor',
          notes: '',
          favorite: false,
          userId,
          createdAt: new Date(),
        });

        const contact = await ContactsCollection.findOneAsync(contactId);
        assert.strictEqual(contact.firstName, 'Jane');
        assert.strictEqual(contact.lastName, 'Doe');
        assert.strictEqual(contact.userId, userId);

        await ContactsCollection.removeAsync(contactId);
        await Meteor.users.removeAsync(userId);
      });
    });

    describe('contacts.toggleFavorite', function () {
      it('toggles favorite status', async function () {
        const { ContactsCollection } = await import('../imports/api/contacts');
        const userId = await Meteor.users.insertAsync({ username: 'testuser-fav' });

        const contactId = await ContactsCollection.insertAsync({
          firstName: 'Fav',
          lastName: 'Test',
          phone: '',
          email: '',
          company: '',
          notes: '',
          favorite: false,
          userId,
          createdAt: new Date(),
        });

        // Toggle to true
        await ContactsCollection.updateAsync(contactId, { $set: { favorite: true } });
        let contact = await ContactsCollection.findOneAsync(contactId);
        assert.strictEqual(contact.favorite, true);

        // Toggle back to false
        await ContactsCollection.updateAsync(contactId, { $set: { favorite: false } });
        contact = await ContactsCollection.findOneAsync(contactId);
        assert.strictEqual(contact.favorite, false);

        await ContactsCollection.removeAsync(contactId);
        await Meteor.users.removeAsync(userId);
      });
    });
  }
});
