import { Meteor } from 'meteor/meteor';
import { Events, Rollups, Instances, Snapshot } from './collections';
import { TERMINAL_METHOD_EVENTS, minuteOf } from './collector-core';
import { computeSnapshot, SERIES_MINUTES } from './snapshot-core';

const MINUTE_MS = 60 * 1000;

export async function refreshSnapshot({ windowMs, instanceId, now = Date.now() }) {
  const [terminalEvents, recentEvents, rollups, instances] = await Promise.all([
    Events.rawCollection()
      .find({ type: { $in: TERMINAL_METHOD_EVENTS }, ts: { $gte: now - windowMs } },
        { projection: { _id: 0, type: 1, name: 1, durationMs: 1, ts: 1 } })
      .sort({ ts: -1 }).limit(2000).toArray(),
    Events.rawCollection()
      .find({}, { projection: { _id: 0 } })
      .sort({ $natural: -1 }).limit(50).toArray(),
    Rollups.rawCollection()
      .find({ minute: { $gte: new Date(minuteOf(now) - (SERIES_MINUTES - 1) * MINUTE_MS) } })
      .toArray(),
    Instances.find().fetchAsync(),
  ]);
  const snapshot = computeSnapshot({ terminalEvents, recentEvents, rollups, instances, now, windowMs });
  // Written through Meteor so subscribers are notified even without oplog.
  await Snapshot.updateAsync('live', { $set: { ...snapshot, computedAt: new Date(now), computedBy: instanceId } });
}

export async function startSnapshotRefresh({ refreshMs, windowMs, instanceId }) {
  await Snapshot.upsertAsync('live', { $setOnInsert: { computedAt: new Date(0) } });
  return Meteor.setInterval(async () => {
    const now = Date.now();
    // Compare-and-set on computedAt: with several instances, only the one whose
    // update matches computes this round, without a leader election.
    const claimed = await Snapshot.updateAsync(
      { _id: 'live', computedAt: { $lte: new Date(now - refreshMs * 0.8) } },
      { $set: { computedAt: new Date(now), computedBy: instanceId } },
    );
    if (!claimed) return;
    await refreshSnapshot({ windowMs, instanceId, now })
      .catch((error) => console.error(`[observability] snapshot failed: ${error.message}`));
  }, refreshMs);
}
