import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
  Page, Navbar, LoginScreenTitle, List, ListInput, ListButton, BlockFooter, f7,
} from 'framework7-react';

export default function LoginPage({ f7router }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      f7.dialog.alert('Please fill in all fields.');
      return;
    }

    if (isRegister) {
      Accounts.createUser({ email: email.trim(), password }, (err) => {
        if (err) {
          f7.dialog.alert(err.reason || err.message);
          return;
        }
        f7router.navigate('/', { reloadAll: true });
      });
    } else {
      Meteor.loginWithPassword(email.trim(), password, (err) => {
        if (err) {
          f7.dialog.alert(err.reason || err.message);
          return;
        }
        f7router.navigate('/', { reloadAll: true });
      });
    }
  };

  return (
    <Page noToolbar noSwipeback loginScreen>
      <Navbar title="Contacts" />
      <LoginScreenTitle>{isRegister ? 'Create Account' : 'Sign In'}</LoginScreenTitle>
      <List inset strong>
        <ListInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onInput={(e) => setEmail(e.target.value)}
          data-testid="login-email"
        />
        <ListInput
          label="Password"
          type="password"
          placeholder="Password"
          value={password}
          onInput={(e) => setPassword(e.target.value)}
          data-testid="login-password"
        />
        <ListButton onClick={handleSubmit} data-testid="login-submit">
          {isRegister ? 'Create Account' : 'Sign In'}
        </ListButton>
        <BlockFooter className="text-align-center">
          <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); }} data-testid="login-toggle">
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </a>
        </BlockFooter>
      </List>
    </Page>
  );
}
