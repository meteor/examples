import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import {
  Page, Navbar, NavRight, Link, List, ListInput, f7,
} from 'framework7-react';
import { ContactsCollection } from '/imports/api/contacts';

export default function ContactFormPage({ contactId, f7router }) {
  const existing = useTracker(() => {
    if (!contactId) return null;
    return ContactsCollection.findOne(contactId);
  });

  const isEdit = !!contactId;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName || '');
      setLastName(existing.lastName || '');
      setPhone(existing.phone || '');
      setEmail(existing.email || '');
      setCompany(existing.company || '');
      setNotes(existing.notes || '');
    }
  }, [existing?._id]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      f7.dialog.alert('First name is required.');
      return;
    }

    try {
      if (isEdit) {
        await Meteor.callAsync('contacts.update', {
          _id: contactId, firstName, lastName, phone, email, company, notes,
        });
      } else {
        await Meteor.callAsync('contacts.insert', {
          firstName, lastName, phone, email, company, notes, favorite: false,
        });
      }
      f7router.back();
    } catch (err) {
      f7.dialog.alert(err.reason || err.message);
    }
  };

  return (
    <Page data-testid="contact-form-page">
      <Navbar title={isEdit ? 'Edit Contact' : 'New Contact'} backLink="Cancel">
        <NavRight>
          <Link onClick={handleSave} data-testid="save-btn">Save</Link>
        </NavRight>
      </Navbar>
      <List strongIos insetMd>
        <ListInput
          label="First Name"
          type="text"
          placeholder="First name"
          value={firstName}
          onInput={(e) => setFirstName(e.target.value)}
          required
          data-testid="input-firstName"
        />
        <ListInput
          label="Last Name"
          type="text"
          placeholder="Last name"
          value={lastName}
          onInput={(e) => setLastName(e.target.value)}
          data-testid="input-lastName"
        />
        <ListInput
          label="Phone"
          type="tel"
          placeholder="Phone number"
          value={phone}
          onInput={(e) => setPhone(e.target.value)}
          data-testid="input-phone"
        />
        <ListInput
          label="Email"
          type="email"
          placeholder="Email address"
          value={email}
          onInput={(e) => setEmail(e.target.value)}
          data-testid="input-email"
        />
        <ListInput
          label="Company"
          type="text"
          placeholder="Company"
          value={company}
          onInput={(e) => setCompany(e.target.value)}
          data-testid="input-company"
        />
        <ListInput
          label="Notes"
          type="textarea"
          placeholder="Notes"
          value={notes}
          onInput={(e) => setNotes(e.target.value)}
          data-testid="input-notes"
        />
      </List>
    </Page>
  );
}
