import React, { Suspense } from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { Routes } from "../app/ui/common/Routes";

Meteor.startup(() => {
  render(
    <Suspense fallback={() => <h1>Loading...</h1>}>
      <Routes />
    </Suspense>,
    document.getElementById('react-target')
  );
});
