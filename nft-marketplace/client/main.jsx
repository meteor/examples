import React, { Suspense } from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { Routes } from "../app/ui/common/Routes";
import { Loading } from "../app/ui/components/Loading";

Meteor.startup(() => {
  render(
    <Suspense fallback={<Loading />}>
      <Routes />
    </Suspense>,
    document.getElementById('react-target')
  );
});
