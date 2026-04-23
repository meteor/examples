import { Meteor } from 'meteor/meteor';
import { ContactsCollection } from '/imports/api/contacts';

let observeHandle = null;

export function supportsNotifications() {
  return typeof Notification !== 'undefined';
}

export async function requestNotificationPermission() {
  if (!supportsNotifications()) {
    console.warn('[Notifications] Not supported in this browser.');
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

function showNotification(title, body) {
  if (!supportsNotifications() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'contacts-update',
    });
  } catch (e) {
    // Fallback for environments where Notification constructor fails (some Cordova)
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body, icon: '/favicon.ico', tag: 'contacts-update' });
      });
    }
  }
}

export function startContactsObserver() {
  if (observeHandle || !Meteor.userId()) return;

  // Skip initial adds — only notify on changes after the subscription is ready
  let initializing = true;

  observeHandle = ContactsCollection.find().observeChanges({
    added(id, fields) {
      if (initializing) return;
      showNotification(
        'New Contact',
        `${fields.firstName || ''} ${fields.lastName || ''}`.trim() + ' was added.'
      );
    },
    changed(id, fields) {
      if (initializing) return;
      const contact = ContactsCollection.findOne(id);
      if (!contact) return;
      const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      showNotification('Contact Updated', `${name} was updated.`);
    },
    removed(id) {
      showNotification('Contact Removed', 'A contact was removed.');
    },
  });

  // Mark initialization complete after current data is loaded
  Meteor.defer(() => { initializing = false; });
}

export function stopContactsObserver() {
  if (observeHandle) {
    observeHandle.stop();
    observeHandle = null;
  }
}
