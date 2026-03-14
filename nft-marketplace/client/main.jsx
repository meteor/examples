import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { Routes } from "../app/ui/common/Routes";

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  root.render(
    <Suspense fallback={<h1>Loading...</h1>}>
      <Routes />
    </Suspense>
  );
});
