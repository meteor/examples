import { Meteor } from 'meteor/meteor';
import { Events, Rollups, Instances, Snapshot } from './collections';
import { TERMINAL_METHOD_EVENTS, minuteOf } from './collector-core';
import { computeSnapshot, SERIES_MINUTES, LATENCY_SAMPLE_SIZE } from './snapshot-core';
import { logFailure } from './log';

const MINUTE_MS = 60 * 1000;

// Takes the lease to compute the next snapshot, when the current one is old
// enough and no other refresh holds the lease: with several instances, one
// computes each round without a leader election. The lease outlives a refresh
// by far, so a slow one is not preempted by the next tick.
export async function claimSnapshot({ refreshMs, instanceId, now }) {
  const claimed = await Snapshot.updateAsync(
    {
      _id: 'live',
      computedAt: { $lte: new Date(now - refreshMs * 0.8) },
      // $not also matches a document that has no lease field yet.
      claimedAt: { $not: { $gt: new Date(now - refreshMs * 5) } },
    },
    { $set: { claimedAt: new Date(now), claimedBy: instanceId } },
  );
  return claimed === 1;
}

// Recomputes the snapshot for the lease taken at `now`. Returns false when the
// lease was taken over meanwhile, in which case nothing is written.
export async function refreshSnapshot({ windowMs, instanceId, now, staleMs }) {
  const inWindow = { type: { $in: TERMINAL_METHOD_EVENTS }, ts: { $gte: now - windowMs } };
  const [totals, latencySample, recentEvents, [oldestEvent], rollups, instances] = await Promise.all([
    // Exact counts for the window, independent of the latency sample below.
    Events.rawCollection().aggregate([
      { $match: inWindow },
      { $group: { _id: { name: '$name', type: '$type' }, count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id.name', type: '$_id.type', count: 1 } },
    ]).toArray(),
    // The newest calls only: the percentiles are computed from this sample.
    Events.rawCollection()
      .find(inWindow, { projection: { _id: 0, name: 1, durationMs: 1 } })
      .sort({ ts: -1 }).limit(LATENCY_SAMPLE_SIZE).toArray(),
    Events.rawCollection()
      .find({}, { projection: { _id: 0 } })
      .sort({ $natural: -1 }).limit(50).toArray(),
    // The capped collection may hold less than the window: say since when.
    Events.rawCollection()
      .find({}, { projection: { _id: 0, ts: 1 } })
      .sort({ $natural: 1 }).limit(1).toArray(),
    Rollups.rawCollection()
      .find({ minute: { $gte: new Date(minuteOf(now) - (SERIES_MINUTES - 1) * MINUTE_MS) } })
      .toArray(),
    Instances.find().fetchAsync(),
  ]);
  const snapshot = computeSnapshot({
    totals, latencySample, recentEvents, oldestTs: oldestEvent?.ts, rollups, instances, now, windowMs, staleMs,
  });
  // Written through Meteor so subscribers are notified even without oplog, and
  // only while this lease is still the current one: an older refresh that
  // finishes last must not replace a newer snapshot. Writing releases the lease.
  const written = await Snapshot.updateAsync(
    { _id: 'live', claimedAt: new Date(now), claimedBy: instanceId },
    { $set: { ...snapshot, computedAt: new Date(now), computedBy: instanceId, claimedAt: new Date(0) } },
  );
  return written === 1;
}

export async function startSnapshotRefresh({ refreshMs, windowMs, instanceId }) {
  await Snapshot.upsertAsync('live', { $setOnInsert: { computedAt: new Date(0) } });
  // An instance stays listed while its heartbeat, sent every refreshMs, is recent.
  const staleMs = refreshMs * 5;
  return Meteor.setInterval(() => {
    const now = Date.now();
    claimSnapshot({ refreshMs, instanceId, now })
      .then((claimed) => (claimed ? refreshSnapshot({ windowMs, instanceId, now, staleMs }) : null))
      .then((written) => {
        if (written === false) logFailure('snapshot', new Error('the refresh outlived its lease and was discarded'));
      })
      .catch((error) => logFailure('snapshot', error));
  }, refreshMs);
}
