import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import '/imports/api/tasks/methods';
import { Events, Rollups, Snapshot } from '/imports/observability/collections';
import { startCollector, instanceId } from '/imports/observability/collector';
import { refreshSnapshot } from '/imports/observability/snapshot';
import { minuteOf } from '/imports/observability/collector-core';

describe('observability pipeline', function () {
  let collector;

  before(function () {
    collector = startCollector({ flushMs: 60 * 1000, maxQueue: 1000, refreshMs: 60 * 1000 });
  });

  after(function () {
    collector.stop();
  });

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

    await Snapshot.upsertAsync('live', { $setOnInsert: { computedAt: new Date(0) } });
    await refreshSnapshot({ windowMs: 5 * 60 * 1000, instanceId });
    const snapshot = await Snapshot.findOneAsync('live');
    assert.ok(snapshot.computedAt.getTime() >= startedAt);
    assert.ok(snapshot.methods.some((method) => method.name === 'tasks.insert'));
  });
});
