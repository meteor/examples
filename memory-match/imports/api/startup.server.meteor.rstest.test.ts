import { Meteor } from 'meteor/meteor';
import { expect, test } from '@rstest/core';

import '../../server/main';

test('client runtime support host loads real application server modules', () => {
  expect(Meteor.isServer).toBe(true);
});
