import { Meteor } from 'meteor/meteor';
import { expect, test } from '@rstest/core';

test('imports infer a real Meteor runtime on each selected architecture', () => {
  expect(Meteor.isTest).toBe(true);
  expect(Meteor.isServer || Meteor.isClient).toBe(true);
});
