import React from 'react';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import { render } from 'react-dom'

Meteor.startup(() => {
  const root = document.getElementById('react-target')
  render(<App />, root)
});
