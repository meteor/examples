import React from 'react';
import { App, View } from 'framework7-react';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import ContactFormPage from './pages/ContactFormPage';
import LoginPage from './pages/LoginPage';

import '../../client/main.css';

const routes = [
  { path: '/', component: ContactsPage },
  { path: '/contact/:contactId/', component: ContactDetailPage },
  { path: '/contact-form/', component: ContactFormPage },
  { path: '/contact-form/:contactId/', component: ContactFormPage },
  { path: '/login/', component: LoginPage },
];

/**
 * Framework7 App Configuration
 *
 * The `colors` object defines the named color palette for F7 components.
 * `primary` is used for navbars, buttons, links, and active states.
 * Additional named colors are available via `color="red"` props on F7 components.
 *
 * Docs: https://framework7.io/docs/color-theme
 */
const f7params = {
  name: 'Contacts',
  theme: 'auto',
  darkMode: 'auto',
  routes,
  colors: {
    primary: '#e45735',
    red: '#ff3b30',
    green: '#4cd964',
    blue: '#2196f3',
    pink: '#ff2d55',
    yellow: '#ffcc00',
    orange: '#ff9500',
    purple: '#9c27b0',
  },
};

export function ContactsApp() {
  return (
    <App {...f7params}>
      <View main url="/" iosDynamicNavbar={false} />
    </App>
  );
}
