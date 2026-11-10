import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import '/imports/api/tasks/methods';
import { Events, Rollups, Snapshot } from '/imports/observability/collections';
import { startCollector, instanceId } from '/imports/observability/collector';
import { claimSnapshot, refreshSnapshot } from '/imports/observability/snapshot';
import { minuteOf } from '/imports/observability/collector-core';
import { LATENCY_SAMPLE_SIZE } from '/imports/observability/snapshot-core';

const WINDOW_MS = 5 * 60 * 1000;

Meteor.methods({
  'regression.good'() {},
  'regression.bad'() {},
});

describe('observability pipeline', function () {
  let collector;

  before(async function () {
    collector = startCollector({ flushMs: 60 * 1000, maxQueue: 1000, refreshMs: 60 * 1000 });
    await Snapshot.upsertAsync('live', { $setOnInsert: { computedAt: new Date(0) } });
  });

  after(function () {
    collector.stop();
  });

  // Takes the claim for `now` as the refresh interval does, whatever the previous claim.
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

    const rollup = await Rollups.findOneAsync(`${new Date(minuteOf(Date.now())).toISOString()}|tasks.insert`);
    assert.ok(rollup && rollup.calls >= 2 && rollup.errors >= 1, 'the minute rollup is incremented');

    const now = Date.now();
    assert.ok(await claimNow(now));
    assert.strictEqual(await refreshSnapshot({ windowMs: WINDOW_MS, instanceId, now }), true);
    const snapshot = await Snapshot.findOneAsync('live');
    assert.strictEqual(snapshot.computedAt.getTime(), now);
    assert.ok(snapshot.methods.some((method) => method.name === 'tasks.insert'));
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
    assert.ok(snapshot.errors >= 1, 'the window error count keeps the oldest error');
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

  it('retries the counters a failed rollup write left pending, exactly once', async function () {
    const rollups = Rollups.rawCollection();
    const callsOf = async (name) => (await Rollups.find({ name }).fetchAsync())
      .reduce((total, rollup) => total + rollup.calls, 0);
    const setValidator = (validator) => Rollups.rawDatabase()
      .command({ collMod: rollups.collectionName, validator });

    // MongoDB rejects the rollup of one method while the other one, written in
    // the same bulk write, succeeds.
    await setValidator({ name: { $ne: 'regression.bad' } });
    try {
      await Meteor.callAsync('regression.good');
      await Meteor.callAsync('regression.bad');
      await collector.flush();
      assert.strictEqual(await callsOf('regression.good'), 1);
      assert.strictEqual(await callsOf('regression.bad'), 0);
    } finally {
      await setValidator({});
    }

    await collector.flush();
    assert.strictEqual(await callsOf('regression.good'), 1, 'the written counter is not counted again');
    assert.strictEqual(await callsOf('regression.bad'), 1, 'the pending counter is written once');
    const [badEvent] = await Events.find({ name: 'regression.bad', type: 'method.end' }).fetchAsync();
    assert.ok(badEvent, 'the raw event was stored by the first flush');
  });
});
