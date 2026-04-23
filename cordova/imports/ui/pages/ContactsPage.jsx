import React, { useState, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import {
  Page, Navbar, NavRight, Link, List, ListItem, ListGroup,
  Searchbar, Fab, Icon, SwipeoutActions, SwipeoutButton, f7,
} from 'framework7-react';
import { ContactsCollection } from '/imports/api/contacts';
import { getInitials, getFullName, getAvatarColor, groupContactsByLetter } from '../helpers';
import {
  requestNotificationPermission, startContactsObserver, stopContactsObserver,
} from '/imports/infra/notifications';

export default function ContactsPage({ f7router }) {
  const [search, setSearch] = useState('');
  const observerStarted = useRef(false);

  const { user, contacts, loading } = useTracker(() => {
    const currentUser = Meteor.user();
    const sub = Meteor.subscribe('contacts');
    const allContacts = ContactsCollection.find({}, { sort: { firstName: 1, lastName: 1 } }).fetch();
    return { user: currentUser, contacts: allContacts, loading: !sub.ready() };
  });

  // Request notification permission and start observer when logged in
  useEffect(() => {
    if (user && !loading && !observerStarted.current) {
      observerStarted.current = true;
      requestNotificationPermission();
      startContactsObserver();
    }
    return () => {
      if (observerStarted.current) {
        stopContactsObserver();
        observerStarted.current = false;
      }
    };
  }, [user, loading]);

  // Redirect to login if not authenticated
  if (!user && !loading) {
    // Use setTimeout to avoid rendering issues during initial load
    setTimeout(() => f7router.navigate('/login/', { reloadAll: true }), 0);
    return <Page />;
  }

  const filtered = search.trim()
    ? contacts.filter(c => getFullName(c).toLowerCase().includes(search.toLowerCase()))
    : contacts;

  const groups = groupContactsByLetter(filtered);

  const handleDelete = (contactId) => {
    Meteor.callAsync('contacts.remove', { _id: contactId }).catch(err => {
      f7.dialog.alert(err.reason || err.message);
    });
  };

  const handleToggleFavorite = (contactId) => {
    Meteor.callAsync('contacts.toggleFavorite', { _id: contactId }).catch(err => {
      f7.dialog.alert(err.reason || err.message);
    });
  };

  const handleLogout = () => {
    Meteor.logout(() => f7router.navigate('/login/', { reloadAll: true }));
  };

  return (
    <Page>
      <Navbar title="Contacts" large>
        <NavRight>
          <Link iconF7="person_crop_circle" onClick={handleLogout} data-testid="logout-btn" />
        </NavRight>
      </Navbar>
      <Searchbar
        customSearch
        placeholder="Search contacts"
        clearButton
        disableButton
        disableButtonText="Cancel"
        onSearchbarSearch={(sb, query) => setSearch(query)}
        onSearchbarClear={() => setSearch('')}
        data-testid="searchbar"
      />

      {!loading && contacts.length === 0 && (
        <div className="text-align-center" style={{ padding: '40px 16px', color: '#999' }}>
          <Icon f7="person_2" size={64} style={{ marginBottom: 16 }} />
          <p>No contacts yet. Tap + to add one.</p>
        </div>
      )}

      {groups.length > 0 && (
        <List contactsList strongIos className="contacts-list" data-testid="contacts-list">
          {groups.map(({ letter, contacts: groupContacts }) => (
            <ListGroup key={letter}>
              <ListItem title={letter} groupTitle />
              {groupContacts.map(contact => (
                <ListItem
                  key={contact._id}
                  link={`/contact/${contact._id}/`}
                  title={getFullName(contact)}
                  after={contact.favorite ? '★' : ''}
                  swipeout
                  data-testid={`contact-item-${contact._id}`}
                >
                  <div
                    slot="media"
                    className="contact-avatar"
                    style={{ backgroundColor: getAvatarColor(contact) }}
                  >
                    {getInitials(contact)}
                  </div>
                  <SwipeoutActions right>
                    <SwipeoutButton
                      close
                      color="blue"
                      onClick={() => handleToggleFavorite(contact._id)}
                    >
                      {contact.favorite ? 'Unfav' : 'Fav'}
                    </SwipeoutButton>
                    <SwipeoutButton
                      delete
                      confirmText={`Delete ${getFullName(contact)}?`}
                      confirmTitle="Delete Contact"
                      onClick={() => handleDelete(contact._id)}
                    >
                      Delete
                    </SwipeoutButton>
                  </SwipeoutActions>
                </ListItem>
              ))}
            </ListGroup>
          ))}
        </List>
      )}

      <Fab position="right-bottom" slot="fixed" href="/contact-form/" data-testid="add-contact-fab">
        <Icon f7="plus" />
      </Fab>
    </Page>
  );
}
