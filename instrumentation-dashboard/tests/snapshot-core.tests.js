import assert from 'assert';
import { computeSnapshot, percentile, SERIES_MINUTES } from '/imports/observability/snapshot-core';

const MINUTE = 60 * 1000;

describe('snapshot core', function () {
  it('uses nearest-rank percentiles', function () {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    assert.strictEqual(percentile(sorted, 50), 5);
    assert.strictEqual(percentile(sorted, 95), 10);
    assert.strictEqual(percentile([], 95), 0);
  });

  it('computes rates, per-method stats, the series and live instances', function () {
    const now = Date.UTC(2026, 9, 19, 10, 30, 20);
    const lastMinute = Date.UTC(2026, 9, 19, 10, 30);
    const totals = [
      { name: 'tasks.insert', type: 'method.end', count: 2 },
      { name: 'tasks.insert', type: 'method.error', count: 1 },
      { name: 'tasks.remove', type: 'method.end', count: 1 },
      { name: 'tasks.toggle', type: 'method.end', count: 1 },
    ];
    const latencySample = [
      { name: 'tasks.insert', durationMs: 10 },
      { name: 'tasks.insert', durationMs: 20 },
      { name: 'tasks.insert', durationMs: 30 },
      { name: 'tasks.remove', durationMs: 5 },
    ];
    const rollups = [
      { minute: new Date(lastMinute), calls: 4, errors: 1 },
      { minute: new Date(lastMinute - 2 * MINUTE), calls: 7, errors: 0 },
      { minute: new Date(lastMinute - 90 * MINUTE), calls: 99, errors: 9 },
    ];
    const instances = [
      { _id: 'a', connections: 2, publications: 3, dropped: 1, lastSeen: new Date(now - 1000) },
      { _id: 'b', connections: 5, publications: 5, dropped: 0, lastSeen: new Date(now - 60000) },
    ];

    const snapshot = computeSnapshot({
      totals, latencySample, recentEvents: [], oldestTs: now - 2 * MINUTE, rollups, instances, now, windowMs: 5 * MINUTE,
    });

    assert.strictEqual(snapshot.calls, 5);
    assert.strictEqual(snapshot.errors, 1);
    assert.strictEqual(snapshot.errorRate, 0.2);
    assert.strictEqual(snapshot.p50, 10);
    assert.strictEqual(snapshot.sampled, true);
    assert.deepStrictEqual(snapshot.eventsSince, new Date(now - 2 * MINUTE));
    assert.deepStrictEqual(snapshot.methods.map(({ name, calls, errors, p95 }) => ({ name, calls, errors, p95 })), [
      { name: 'tasks.insert', calls: 3, errors: 1, p95: 30 },
      { name: 'tasks.remove', calls: 1, errors: 0, p95: 5 },
      // Counted in the window but absent from the latency sample: no duration.
      { name: 'tasks.toggle', calls: 1, errors: 0, p95: null },
    ]);
    assert.strictEqual(snapshot.series.length, SERIES_MINUTES);
    assert.deepStrictEqual(snapshot.series.at(-1), { minute: new Date(lastMinute), calls: 4, errors: 1 });
    assert.strictEqual(snapshot.series.at(-3).calls, 7);
    assert.strictEqual(snapshot.series.reduce((total, point) => total + point.calls, 0), 11);
    assert.deepStrictEqual(snapshot.instances.map(({ _id }) => _id), ['a']);
    assert.strictEqual(snapshot.connections, 2);
    assert.strictEqual(snapshot.dropped, 1);
  });
});
