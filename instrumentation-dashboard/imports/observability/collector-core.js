// Pure helpers of the collector, kept free of I/O so they can be unit tested.

export const TERMINAL_METHOD_EVENTS = ['method.end', 'method.error'];

const MINUTE_MS = 60 * 1000;

// The document stored for one event. The seam already bounds every value.
export function toEventDoc(event, instanceId) {
  const doc = { ts: event.ts, type: event.type, instanceId };
  for (const field of ['name', 'traceId', 'spanId', 'connectionId', 'userId',
    'subscriptionId', 'durationMs', 'error', 'args', 'result']) {
    if (event[field] !== undefined && event[field] !== null) doc[field] = event[field];
  }
  return doc;
}

// A bounded FIFO: when full, the oldest entry is dropped and counted.
export function createBoundedQueue(maxSize) {
  let items = [];
  let dropped = 0;
  return {
    push(item) {
      items.push(item);
      if (items.length > maxSize) {
        items.shift();
        dropped += 1;
      }
    },
    // Puts back a batch that could not be written, still within the bound.
    unshift(batch) {
      items = batch.concat(items);
      const overflow = items.length - maxSize;
      if (overflow > 0) {
        items.splice(0, overflow);
        dropped += overflow;
      }
    },
    drain() {
      const batch = items;
      items = [];
      return batch;
    },
    get size() { return items.length; },
    get dropped() { return dropped; },
  };
}

export function minuteOf(ts) {
  return Math.floor(ts / MINUTE_MS) * MINUTE_MS;
}

// Adds a terminal method event to the per-minute counters of a flush.
export function addToRollups(rollups, event) {
  if (!TERMINAL_METHOD_EVENTS.includes(event.type)) return;
  const minute = minuteOf(event.ts);
  const key = `${new Date(minute).toISOString()}|${event.name}`;
  const rollup = rollups.get(key)
    ?? { minute, name: event.name, calls: 0, errors: 0, totalMs: 0, maxMs: 0 };
  rollup.calls += 1;
  if (event.type === 'method.error') rollup.errors += 1;
  rollup.totalMs += event.durationMs ?? 0;
  rollup.maxMs = Math.max(rollup.maxMs, event.durationMs ?? 0);
  rollups.set(key, rollup);
}

// MongoDB upserts for the counters gathered during one flush.
export function rollupOperations(rollups) {
  return [...rollups].map(([key, rollup]) => ({
    updateOne: {
      filter: { _id: key },
      update: {
        $setOnInsert: { minute: new Date(rollup.minute), name: rollup.name },
        $inc: { calls: rollup.calls, errors: rollup.errors, totalMs: rollup.totalMs },
        $max: { maxMs: rollup.maxMs },
      },
      upsert: true,
    },
  }));
}
