import { Mongo } from 'meteor/mongo';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from '@rstest/core';

interface Probe {
  _id: string;
  lane: string;
}

const ConcurrentProbes = new Mongo.Collection<Probe>('showcase_concurrent_probes');
let active = 0;
let started = 0;
let inserted = 0;
let release: () => void;
const firstPairStarted = new Promise<void>((resolve) => {
  release = resolve;
});

describe.concurrent('Meteor runtime concurrency', () => {
  beforeAll(async () => {
    await ConcurrentProbes.removeAsync({});
  });

  afterAll(async () => {
    await ConcurrentProbes.removeAsync({});
  });

  for (const lane of ['methods', 'publications', 'collections']) {
    test(lane, async () => {
      active += 1;
      started += 1;
      try {
        expect(active <= 2).toBe(true);
        await ConcurrentProbes.insertAsync({ _id: lane, lane });
        inserted += 1;
        if (inserted === 2) release();
        await firstPairStarted;
        expect((await ConcurrentProbes.find().countAsync()) >= 2).toBe(true);
      } finally {
        active -= 1;
      }
    });
  }

  test.sequential('observes completed cases in same Meteor host', async () => {
    expect(active).toBe(0);
    expect(started).toBe(3);
    expect(await ConcurrentProbes.find().countAsync()).toBe(3);
  });
});
