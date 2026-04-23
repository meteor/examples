import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import {
  Page, Navbar, NavRight, Link, List, ListItem, Block, Icon, f7,
} from 'framework7-react';
import { ContactsCollection } from '/imports/api/contacts';
import { getInitials, getFullName, getAvatarColor } from '../helpers';

export default function ContactDetailPage({ contactId, f7router }) {
  const contact = useTracker(() => {
    return ContactsCollection.findOne(contactId);
  });

  if (!contact) {
    return (
      <Page>
        <Navbar title="Contact" backLink="Back" />
        <Block className="text-align-center">
          <p>Contact not found.</p>
        </Block>
      </Page>
    );
  }

  const handleToggleFavorite = () => {
    Meteor.callAsync('contacts.toggleFavorite', { _id: contactId }).catch(err => {
      f7.dialog.alert(err.reason || err.message);
    });
  };

  const handleDelete = () => {
    f7.dialog.confirm(`Delete ${getFullName(contact)}?`, 'Delete Contact', () => {
      Meteor.callAsync('contacts.remove', { _id: contactId })
        .then(() => f7router.back())
        .catch(err => f7.dialog.alert(err.reason || err.message));
    });
  };

  return (
    <Page data-testid="contact-detail-page">
      <Navbar title="" backLink="Back">
        <NavRight>
          <Link href={`/contact-form/${contactId}/`} iconF7="pencil" data-testid="edit-btn" />
        </NavRight>
      </Navbar>

      <div className="detail-header">
        <div
          className="contact-avatar-large"
          style={{ backgroundColor: getAvatarColor(contact) }}
        >
          {getInitials(contact)}
        </div>
        <h2 data-testid="contact-name">{getFullName(contact)}</h2>
        {contact.company && <p>{contact.company}</p>}
      </div>

      <Block>
        <Link
          onClick={handleToggleFavorite}
          data-testid="favorite-btn"
          style={{ fontSize: 18 }}
        >
          <Icon
            f7={contact.favorite ? 'star_fill' : 'star'}
            className={contact.favorite ? 'favorite-star' : ''}
          />
          {' '}{contact.favorite ? 'Remove from favorites' : 'Add to favorites'}
        </Link>
      </Block>

      <List strongIos insetMd data-testid="contact-info">
        {contact.phone && (
          <ListItem
            link={`tel:${contact.phone}`}
            title={contact.phone}
            header="Phone"
            external
            data-testid="contact-phone"
          >
            <Icon f7="phone" slot="media" />
          </ListItem>
        )}
        {contact.email && (
          <ListItem
            link={`mailto:${contact.email}`}
            title={contact.email}
            header="Email"
            external
            data-testid="contact-email"
          >
            <Icon f7="envelope" slot="media" />
          </ListItem>
        )}
        {contact.notes && (
          <ListItem title={contact.notes} header="Notes" data-testid="contact-notes">
            <Icon f7="doc_text" slot="media" />
          </ListItem>
        )}
      </List>

      <Block>
        <Link color="red" onClick={handleDelete} data-testid="delete-btn">
          <Icon f7="trash" /> Delete Contact
        </Link>
      </Block>
    </Page>
  );
}
