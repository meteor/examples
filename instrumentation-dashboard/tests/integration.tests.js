import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import '/imports/api/tasks/methods';
import { Events, Rollups, Instances, Snapshot } from '/imports/observability/collections';
import { startCollector, instanceId } from '/imports/observability/collector';
import { claimSnapshot, refreshSnapshot } from '/imports/observability/snapshot';
import { ensureTtlIndex } from '/imports/observability/server';
import { minuteOf } from '/imports/observability/collector-core';
import { LATENCY_SAMPLE_SIZE } from '/imports/observability/snapshot-core';

const WINDOW_MS = 5 * 60 * 1000;

Meteor.methods({
  'regression.stored'() {},
  'regression.rejected'() {},
  'regression.good'() {},
  'regression.bad'() {},
});

// Makes MongoDB reject the documents of one method in a collection, or lifts it.
const rejectInCollection = (collection, validator) => collection.rawDatabase()
  .command({ collMod: collection.rawCollection().collectionName, validator });

const sumOf = async (collection, selector, field) => (await collection.find(selector).fetchAsync())
  .reduce((total, doc) => total + doc[field], 0);

describe('observability pipeline', function () {
  let collector;

  before(async function () {
    // The database outlives test runs in watch mode: start from empty collections.
    for (const collection of [Events, Rollups, Instances, Snapshot]) {
      await collection.rawCollection().drop().catch(() => {});
    }
    for (const collection of [Events, Rollups]) {
      await collection.rawDatabase().createCollection(collection.rawCollection().collectionName);
    }
    await Snapshot.upsertAsync('live', { $setOnInsert: { computedAt: new Date(0) } });
    collector = startCollector({ flushMs: 60 * 1000, maxQueue: 1000, refreshMs: 60 * 1000 });
    await collector.heartbeat();
  });

  after(function () {
    collector.stop();
  });

  // Takes the lease for `now` as the refresh interval does, whatever the previous one.
  const claimNow = (now, instance = instanceId) => claimSnapshot({ refreshMs: 0, instanceId: instance, now });

  it('records a real method call, its rollup and the snapshot', async function () {
    const startedAt = Date.now();
    await Meteor.callAsync('tasks.insert', 'integration test');
    await assert.rejects(Meteor.callAsync('tasks.insert', ' '), { error: 'empty-task' });
    await collector.flush();

    const events = await Events.find({ name: 'tasks.insert', ts: { $gte: startedAt } }).fetchAsync();
    const start = events.find((event) => event.type === 'method.start');
    const end = events.find((event) => event.type === 'method.end');
    assert.ok(start && end, 'method.start and method.end are stored');
    assert.strictEqual(start.traceId, end.traceId);
    assert.strictEqual(start.instanceId, instanceId);
    assert.ok(events.some((event) => event.type === 'method.error'), 'method.error is stored');

    const since = { name: 'tasks.insert', minute: { $gte: new Date(minuteOf(startedAt)) } };
    assert.strictEqual(await sumOf(Rollups, since, 'calls'), 2, 'the minute rollup counts both calls');
    assert.strictEqual(await sumOf(Rollups, since, 'errors'), 1, 'the minute rollup counts the error');

    const now = Date.now();
    assert.ok(await claimNow(now));
    assert.strictEqual(await refreshSnapshot({ windowMs: WINDOW_MS, instanceId, now }), true);
    const snapshot = await Snapshot.findOneAsync('live');
    assert.strictEqual(snapshot.computedAt.getTime(), now);
    assert.strictEqual(snapshot.claimedAt.getTime(), 0, 'the lease is released');
    assert.ok(snapshot.methods.some((method) => method.name === 'tasks.insert'));
    assert.ok(snapshot.instances.some((instance) => instance._id === instanceId), 'the first heartbeat was sent');
  });

  it('counts every call of the window, beyond the latency sample', async function () {
    const now = Date.now();
    const name = 'regression.sample';
    // One more call than the sample holds; the oldest one is the only error.
    await Events.rawCollection().insertMany(Array.from({ length: LATENCY_SAMPLE_SIZE + 1 }, (_, index) => ({
      ts: now - 1000 - index,
      type: index === LATENCY_SAMPLE_SIZE ? 'method.error' : 'method.end',
      name,
      durationMs: 1,
      instanceId,
    })));

    assert.ok(await claimNow(now));
    await refreshSnapshot({ windowMs: WINDOW_MS, instanceId, now });
    const snapshot = await Snapshot.findOneAsync('live');
    const method = snapshot.methods.find((entry) => entry.name === name);
    assert.deepStrictEqual({ calls: method.calls, errors: method.errors }, { calls: LATENCY_SAMPLE_SIZE + 1, errors: 1 });
    assert.ok(snapshot.errors >= 1, 'the window keeps the oldest error');
    assert.strictEqual(snapshot.sampleSize, LATENCY_SAMPLE_SIZE);
    assert.strictEqual(snapshot.sampled, true);
  });

  it('keeps the newer snapshot when an older refresh finishes last', async function () {
    const older = Date.now();
    const newer = older + 1;
    assert.ok(await claimNow(older));
    assert.ok(await claimNow(newer, 'other-instance'));

    assert.strictEqual(await refreshSnapshot({ windowMs: WINDOW_MS, instanceId: 'other-instance', now: newer }), true);
    assert.strictEqual(await refreshSnapshot({ windowMs: WINDOW_MS, instanceId, now: older }), false);
    const snapshot = await Snapshot.findOneAsync('live');
    assert.strictEqual(snapshot.computedAt.getTime(), newer);
    assert.strictEqual(snapshot.computedBy, 'other-instance');
  });

  it('keeps the lease of a slow refresh until it is written', async function () {
    const refreshMs = 1000;
    const start = Date.now() - 2 * refreshMs;
    await Snapshot.updateAsync('live', { $set: { computedAt: new Date(0), claimedAt: new Date(0) } });
    assert.ok(await claimSnapshot({ refreshMs, instanceId, now: start }));
    // The next ticks find the snapshot due but the lease taken.
    assert.strictEqual(await claimSnapshot({ refreshMs, instanceId: 'other-instance', now: start + refreshMs }), false);
    assert.strictEqual(await claimSnapshot({ refreshMs, instanceId: 'other-instance', now: start + 4 * refreshMs }), false);
    assert.strictEqual(await refreshSnapshot({ windowMs: WINDOW_MS, instanceId, now: start }), true);
    // Written and released: the next due tick takes it and writes its snapshot.
    assert.ok(await claimSnapshot({ refreshMs, instanceId: 'other-instance', now: start + refreshMs }));
    assert.strictEqual(await refreshSnapshot({ windowMs: WINDOW_MS, instanceId: 'other-instance', now: start + refreshMs }), true);
  });

  it('updates the TTL index when the retention changes', async function () {
    const Scratch = new Mongo.Collection('instrumentation_test_ttl');
    const ttlOf = async () => (await Scratch.rawCollection().indexes())
      .find((index) => index.name === 'minute_1').expireAfterSeconds;
    await ensureTtlIndex(Scratch, { minute: 1 }, 60);
    assert.strictEqual(await ttlOf(), 60);
    await ensureTtlIndex(Scratch, { minute: 1 }, 120);
    assert.strictEqual(await ttlOf(), 120);
    await Scratch.rawCollection().drop();
  });

  it('stores the events of a partially failed insert exactly once', async function () {
    const countOf = (name) => Events.find({ name, type: { $in: ['method.start', 'method.end'] } }).countAsync();
    // MongoDB rejects the events of one method while the other method's events,
    // sent in the same insert, are stored.
    await rejectInCollection(Events, { name: { $ne: 'regression.rejected' } });
    try {
      await Meteor.callAsync('regression.stored');
      await Meteor.callAsync('regression.rejected');
      await collector.flush();
      assert.strictEqual(await countOf('regression.stored'), 2);
      assert.strictEqual(await countOf('regression.rejected'), 0);
      assert.strictEqual(await sumOf(Rollups, { name: 'regression.stored' }, 'calls'), 1, 'stored events are counted');
      assert.strictEqual(await sumOf(Rollups, { name: 'regression.rejected' }, 'calls'), 0, 'unstored events are not');
    } finally {
      await rejectInCollection(Events, {});
    }

    await collector.flush();
    assert.strictEqual(await countOf('regression.stored'), 2, 'the stored events are not inserted again');
    assert.strictEqual(await countOf('regression.rejected'), 2, 'the rejected events are stored once');
    assert.strictEqual(await sumOf(Rollups, { name: 'regression.rejected' }, 'calls'), 1);
  });

  it('retries the counters a failed rollup write left pending, exactly once', async function () {
    // MongoDB rejects the rollup of one method while the other one, written in
    // the same bulk write, succeeds.
    await rejectInCollection(Rollups, { name: { $ne: 'regression.bad' } });
    try {
      await Meteor.callAsync('regression.good');
      await Meteor.callAsync('regression.bad');
      await collector.flush();
      assert.strictEqual(await sumOf(Rollups, { name: 'regression.good' }, 'calls'), 1);
      assert.strictEqual(await sumOf(Rollups, { name: 'regression.bad' }, 'calls'), 0);
    } finally {
      await rejectInCollection(Rollups, {});
    }

    // Connection lost before the retry was saved: a bulk write error with an
    // empty writeErrors list must still keep the pending counter.
    const rawCollection = Rollups.rawCollection.bind(Rollups);
    Rollups.rawCollection = () => ({
      bulkWrite: () => Promise.reject(Object.assign(new Error('connection closed'), { writeErrors: [] })),
    });
    try {
      await collector.flush();
      assert.strictEqual(await sumOf(Rollups, { name: 'regression.bad' }, 'calls'), 0);
    } finally {
      Rollups.rawCollection = rawCollection;
    }

    await collector.flush();
    assert.strictEqual(await sumOf(Rollups, { name: 'regression.good' }, 'calls'), 1, 'the written counter is not counted again');
    assert.strictEqual(await sumOf(Rollups, { name: 'regression.bad' }, 'calls'), 1, 'the pending counter is written once');
    assert.strictEqual(await Events.find({ name: 'regression.bad', type: 'method.end' }).countAsync(), 1, 'the raw event was stored by the first flush');
  });
});
