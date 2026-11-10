import os from 'node:os';
import { Meteor } from 'meteor/meteor';
import { Instrumentation } from 'meteor/instrumentation';
import { Events, Rollups, Instances } from './collections';
import {
  toEventDoc, createBoundedQueue, addToRollups, mergeRollup, rollupOperations, unwrittenItems,
} from './collector-core';
import { logFailure } from './log';

const EVENT_TYPES = [
  'method.start', 'method.end', 'method.error',
  'publication.start', 'publication.ready', 'publication.stop', 'publication.error',
  'ddp.connection.open', 'ddp.connection.close',
];

// Several containers can write to the same database: each tags its events.
export const instanceId = process.env.GALAXY_CONTAINER_ID || `${os.hostname()}:${process.pid}`;

export function startCollector({ flushMs, maxQueue, refreshMs }) {
  const queue = createBoundedQueue(maxQueue);
  const gauges = { connections: 0, publications: 0 };

  // Runs inside the method or publication being observed: no I/O here.
  const onEvent = (event) => {
    queue.push(event);
    if (event.type === 'ddp.connection.open') gauges.connections += 1;
    if (event.type === 'ddp.connection.close') gauges.connections = Math.max(0, gauges.connections - 1);
    if (event.type === 'publication.start') gauges.publications += 1;
    if (event.type === 'publication.stop' || event.type === 'publication.error') {
      gauges.publications = Math.max(0, gauges.publications - 1);
    }
  };
  const registrations = EVENT_TYPES.map((type) => Instrumentation.on(type, onEvent));

  // Counters of stored events that are not in the rollups yet.
  let pendingRollups = new Map();

  const writeEvents = async () => {
    const events = queue.drain();
    if (!events.length) return;
    let unwritten = new Set();
    try {
      await Events.rawCollection().insertMany(
        events.map((event) => toEventDoc(event, instanceId)), { ordered: false });
    } catch (error) {
      // The events MongoDB did not store go back to the queue, still bounded.
      // After a partial failure the stored ones stay out, so nothing is
      // inserted twice.
      unwritten = new Set(unwrittenItems(events, error));
      queue.unshift([...unwritten]);
      logFailure('event write', error);
    }
    // Stored events are never inserted again: their counters now wait in the
    // pending rollups, which are retried on their own.
    for (const event of events) {
      if (!unwritten.has(event)) addToRollups(pendingRollups, event);
    }
  };

  const writeRollups = async () => {
    if (!pendingRollups.size) return;
    const rollups = pendingRollups;
    pendingRollups = new Map();
    try {
      await Rollups.rawCollection().bulkWrite(rollupOperations(rollups), { ordered: false });
    } catch (error) {
      // Only the counters the write did not apply are retried, so a partial
      // failure counts nothing twice. A write lost in flight after MongoDB
      // applied it has no such detail and is counted again (see README, Limits).
      for (const [key, counters] of unwrittenItems([...rollups], error)) {
        mergeRollup(pendingRollups, key, counters);
      }
      logFailure('rollup write', error);
    }
  };

  let flushing = false;
  const flush = async () => {
    if (flushing || (queue.size === 0 && pendingRollups.size === 0)) return;
    flushing = true;
    try {
      await writeEvents();
      await writeRollups();
    } finally {
      flushing = false;
    }
  };

  const heartbeat = () => Instances.upsertAsync(instanceId, {
    $set: { ...gauges, dropped: queue.dropped, lastSeen: new Date() },
  });
  const sendHeartbeat = () => heartbeat().catch((error) => logFailure('heartbeat', error));

  const flushTimer = Meteor.setInterval(flush, flushMs);
  const heartbeatTimer = Meteor.setInterval(sendHeartbeat, refreshMs);
  // Listed on the dashboard right away, not after the first interval.
  sendHeartbeat();

  return {
    flush,
    heartbeat,
    stop() {
      Meteor.clearInterval(flushTimer);
      Meteor.clearInterval(heartbeatTimer);
      for (const registration of registrations) registration.stop();
    },
  };
}
