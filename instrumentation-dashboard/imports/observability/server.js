import { Events, Rollups, Instances } from './collections';
import { configureInstrumentation } from './policy';
import { startCollector, instanceId } from './collector';
import { startSnapshotRefresh } from './snapshot';
import { observabilitySettings as settings } from './settings';

async function ensureStorage() {
  const db = Events.rawDatabase();
  const name = Events.rawCollection().collectionName;
  const [existing] = await db.listCollections({ name }).toArray();
  if (!existing) {
    await db.createCollection(name, { capped: true, size: settings.eventsMaxBytes, max: settings.eventsMaxDocs });
  }
  await Events.rawCollection().createIndex({ ts: -1 });
  await Rollups.rawCollection().createIndex({ minute: 1 }, { expireAfterSeconds: settings.rollupTtlSeconds });
  await Instances.rawCollection().createIndex({ lastSeen: 1 }, { expireAfterSeconds: 60 * 60 });
}

export async function startObservability() {
  if (!settings.enabled) return null;
  configureInstrumentation();
  await ensureStorage();
  const collector = startCollector(settings);
  await startSnapshotRefresh({ ...settings, instanceId });
  return collector;
}
