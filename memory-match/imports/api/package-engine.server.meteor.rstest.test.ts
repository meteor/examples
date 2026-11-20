import { expect, test } from '@rstest/core';
import { createPairDeck } from 'meteor/memory-match-engine';

test('app runtime executes source from a local Meteor package', () => {
  expect(createPairDeck(['moon', 'star'])).toEqual([
    { id: 'moon-1', symbol: 'moon' },
    { id: 'moon-2', symbol: 'moon' },
    { id: 'star-1', symbol: 'star' },
    { id: 'star-2', symbol: 'star' },
  ]);
});
