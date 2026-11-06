import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { afterEach, expect, test } from '@rstest/core';
import { createPairDeck } from 'meteor/memory-match-engine';

const PackageTestDocuments = Meteor.isServer
  ? new Mongo.Collection<{ source: string }>('memory_match_engine_package_tests')
  : null;

test('local package export creates deterministic card pairs', () => {
  expect(createPairDeck(['moon', 'sun'])).toEqual([
    { id: 'moon-1', symbol: 'moon' },
    { id: 'moon-2', symbol: 'moon' },
    { id: 'sun-1', symbol: 'sun' },
    { id: 'sun-2', symbol: 'sun' },
  ]);
});

if (Meteor.isServer && PackageTestDocuments) {
  afterEach(async () => {
    await PackageTestDocuments.removeAsync({});
  });

  test('Package.onTest server owns real Meteor and Mongo context', async () => {
    expect(Meteor.isServer).toBe(true);
    const id = await PackageTestDocuments.insertAsync({
      source: 'memory-match-engine-package-test',
    });
    expect(await PackageTestDocuments.findOneAsync(id)).toEqual({
      _id: id,
      source: 'memory-match-engine-package-test',
    });
  });
}

if (Meteor.isClient) {
  test('Package.onTest client runs package export in Meteor browser', () => {
    expect(Meteor.isClient).toBe(true);
    expect(createPairDeck(['star'])).toEqual([
      { id: 'star-1', symbol: 'star' },
      { id: 'star-2', symbol: 'star' },
    ]);
  });
}
