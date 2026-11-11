import { Events, Rollups, Instances } from './collections';
import { configureInstrumentation } from './policy';
import { startCollector, instanceId } from './collector';
import { startSnapshotRefresh } from './snapshot';
import { observabilitySettings as settings } from './settings';

// Creates the TTL index, or updates its delay when the settings changed it.
export async function ensureTtlIndex(collection, key, expireAfterSeconds) {
  try {
    await collection.rawCollection().createIndex(key, { expireAfterSeconds });
  } catch (error) {
    if (error.code !== 85) throw error; // 85: the index exists with other options
    await collection.rawDatabase().command({
      collMod: collection.rawCollection().collectionName,
      index: { keyPattern: key, expireAfterSeconds },
    });
  }
}

async function ensureStorage() {
  const db = Events.rawDatabase();
  const name = Events.rawCollection().collectionName;
  // Created once: MongoDB keeps the size of an existing capped collection.
  await db.createCollection(name, { capped: true, size: settings.eventsMaxBytes, max: settings.eventsMaxDocs })
    .catch((error) => { if (error.code !== 48) throw error; }); // 48: it already exists
  const [info] = await db.listCollections({ name }).toArray();
  if (!info.options?.capped) console.warn(`[observability] ${name} is not capped: events will accumulate`);
  await Events.rawCollection().createIndex({ ts: -1 });
  await ensureTtlIndex(Rollups, { minute: 1 }, settings.rollupTtlSeconds);
  await ensureTtlIndex(Instances, { lastSeen: 1 }, 60 * 60);
}

export async function startObservability() {
  if (!settings.enabled) return null;
  configureInstrumentation();
  await ensureStorage();
  const collector = startCollector(settings);
  await startSnapshotRefresh({ ...settings, instanceId });
  return collector;
}
