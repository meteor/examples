import { Mongo } from 'meteor/mongo';
import { expect, test } from '@rstest/core';

test('runtime worker owns isolated real Mongo database', async () => {
  const workerId = process.env.METEOR_TEST_WORKER_ID ?? 'single';
  const collection = new Mongo.Collection<{ _id: string; workerId: string }>(
    'memory_showcase_worker_isolation',
  );
  const id = 'same-id-in-every-worker';
  await collection.removeAsync(id);
  await collection.insertAsync({ _id: id, workerId });
  expect((await collection.findOneAsync(id))?.workerId).toBe(workerId);
  await collection.removeAsync(id);
});
