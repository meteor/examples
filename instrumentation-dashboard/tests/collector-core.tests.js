import assert from 'assert';
import {
  toEventDoc, createBoundedQueue, addToRollups, rollupOperations, unwrittenItems, minuteOf,
} from '/imports/observability/collector-core';

describe('collector core', function () {
  it('stores the bounded event fields with the instance id', function () {
    const doc = toEventDoc({
      type: 'method.end', ts: 1000, name: 'tasks.insert', traceId: 't', spanId: 's',
      connectionId: null, userId: null, durationMs: 12, argsCount: 1, eventName: 'app.method.end',
    }, 'host:1');
    assert.deepStrictEqual(doc, {
      ts: 1000, type: 'method.end', instanceId: 'host:1', name: 'tasks.insert', traceId: 't', spanId: 's', durationMs: 12,
    });
  });

  it('drops the oldest events beyond the bound and counts them', function () {
    const queue = createBoundedQueue(3);
    for (const item of [1, 2, 3, 4, 5]) queue.push(item);
    assert.strictEqual(queue.dropped, 2);
    assert.deepStrictEqual(queue.drain(), [3, 4, 5]);
    assert.strictEqual(queue.size, 0);
  });

  it('puts a failed batch back without exceeding the bound', function () {
    const queue = createBoundedQueue(3);
    queue.push('new');
    queue.unshift(['a', 'b', 'c']);
    assert.deepStrictEqual(queue.drain(), ['b', 'c', 'new']);
    assert.strictEqual(queue.dropped, 1);
  });

  it('counts terminal method events per minute and method', function () {
    const ts = Date.UTC(2026, 9, 19, 10, 15, 30);
    const rollups = new Map();
    addToRollups(rollups, { type: 'method.start', ts, name: 'tasks.insert' });
    addToRollups(rollups, { type: 'method.end', ts, name: 'tasks.insert', durationMs: 10 });
    addToRollups(rollups, { type: 'method.error', ts: ts + 1000, name: 'tasks.insert', durationMs: 30 });
    assert.strictEqual(rollups.size, 1);
    const [[key, rollup]] = [...rollups];
    assert.strictEqual(key, '2026-10-19T10:15:00.000Z|tasks.insert');
    assert.deepStrictEqual(rollup, { minute: minuteOf(ts), name: 'tasks.insert', calls: 2, errors: 1 });

    const [operation] = rollupOperations(rollups);
    assert.deepStrictEqual(operation.updateOne.update.$inc, { calls: 2, errors: 1 });
    assert.strictEqual(operation.updateOne.upsert, true);
  });

  it('keeps every item of a failed write unless it names the failed operations', function () {
    const items = ['a', 'b', 'c'];
    // Connection lost before the write was saved: a bulk write error without any operation.
    assert.deepStrictEqual(unwrittenItems(items, { writeErrors: [] }), ['a', 'b', 'c']);
    assert.deepStrictEqual(unwrittenItems(items, new Error('connection closed')), ['a', 'b', 'c']);
    // Partial success: only the operations reported as failed are retried.
    assert.deepStrictEqual(unwrittenItems(items, { writeErrors: [{ index: 2 }] }), ['c']);
  });
});
