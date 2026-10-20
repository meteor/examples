import os from 'node:os';
import { Meteor } from 'meteor/meteor';
import { Instrumentation } from 'meteor/instrumentation';
import { Events, Rollups, Instances } from './collections';
import { toEventDoc, createBoundedQueue, addToRollups, rollupOperations } from './collector-core';

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

  let flushing = false;
  let lastErrorLog = 0;
  const flush = async () => {
    if (flushing || queue.size === 0) return;
    flushing = true;
    const events = queue.drain();
    const rollups = new Map();
    for (const event of events) addToRollups(rollups, event);
    let inserted = false;
    try {
      await Events.rawCollection().insertMany(
        events.map((event) => toEventDoc(event, instanceId)), { ordered: false });
      inserted = true;
      if (rollups.size) {
        await Rollups.rawCollection().bulkWrite(rollupOperations(rollups), { ordered: false });
      }
    } catch (error) {
      // MongoDB unavailable: keep the batch for the next tick, still bounded.
      if (!inserted) queue.unshift(events);
      if (Date.now() - lastErrorLog > 60 * 1000) {
        lastErrorLog = Date.now();
        console.error(`[observability] flush failed: ${error.message}`);
      }
    } finally {
      flushing = false;
    }
  };

  const heartbeat = () => Instances.upsertAsync(instanceId, {
    $set: { ...gauges, dropped: queue.dropped, lastSeen: new Date() },
  });

  const flushTimer = Meteor.setInterval(flush, flushMs);
  const heartbeatTimer = Meteor.setInterval(() => {
    heartbeat().catch((error) => console.error(`[observability] heartbeat failed: ${error.message}`));
  }, refreshMs);

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
