import { Meteor } from 'meteor/meteor';
import { Events, Rollups, Instances, Snapshot } from './collections';
import { TERMINAL_METHOD_EVENTS, minuteOf } from './collector-core';
import { computeSnapshot, SERIES_MINUTES, LATENCY_SAMPLE_SIZE } from './snapshot-core';

const MINUTE_MS = 60 * 1000;

// Compare-and-set on computedAt: with several instances, only the one whose
// update matches computes this round, without a leader election.
export async function claimSnapshot({ refreshMs, instanceId, now }) {
  const claimed = await Snapshot.updateAsync(
    { _id: 'live', computedAt: { $lte: new Date(now - refreshMs * 0.8) } },
    { $set: { computedAt: new Date(now), computedBy: instanceId } },
  );
  return claimed === 1;
}

// Recomputes the snapshot for the claim taken at `now`. Returns false when a
// newer claim was taken meanwhile, in which case nothing is written.
export async function refreshSnapshot({ windowMs, instanceId, now = Date.now() }) {
  const inWindow = { type: { $in: TERMINAL_METHOD_EVENTS }, ts: { $gte: now - windowMs } };
  const [totals, latencySample, recentEvents, rollups, instances] = await Promise.all([
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
    Rollups.rawCollection()
      .find({ minute: { $gte: new Date(minuteOf(now) - (SERIES_MINUTES - 1) * MINUTE_MS) } })
      .toArray(),
    Instances.find().fetchAsync(),
  ]);
  const snapshot = computeSnapshot({ totals, latencySample, recentEvents, rollups, instances, now, windowMs });
  // Written through Meteor so subscribers are notified even without oplog, and
  // only while this claim is still the current one: an older refresh that
  // finishes last must not replace a newer snapshot.
  const written = await Snapshot.updateAsync(
    { _id: 'live', computedAt: new Date(now), computedBy: instanceId },
    { $set: { ...snapshot, computedAt: new Date(now), computedBy: instanceId } },
  );
  return written === 1;
}

export async function startSnapshotRefresh({ refreshMs, windowMs, instanceId }) {
  await Snapshot.upsertAsync('live', { $setOnInsert: { computedAt: new Date(0) } });
  return Meteor.setInterval(async () => {
    const now = Date.now();
    if (!(await claimSnapshot({ refreshMs, instanceId, now }))) return;
    await refreshSnapshot({ windowMs, instanceId, now })
      .catch((error) => console.error(`[observability] snapshot failed: ${error.message}`));
  }, refreshMs);
}
