import React from 'react';
import {Dashboard} from './Dashboard';
import {List} from './List';

const Title = () => (
  <div className="container flex flex-col justify-center space-y-2 space-x-2 mb-5">
    <p className="text-3xl text-center m-5">Meteor tailwindcss Example</p>
    <img src="/logo.svg" className="h-7 sm:h-8"/>
  </div>
);

export const App = () => {
  return (
    <div className="divide-y divide-gray-100">
      <Title/>
      <Dashboard/>
      <List/>
    </div>
  );
};
