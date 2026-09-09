const OFFLINE_HYDRATION_GUARD = Symbol.for(
  'civic-snap.offline-hydration-guard'
);

export function makeOfflineHydrationIdempotent(localCollection) {
  if (!localCollection?.insert || localCollection[OFFLINE_HYDRATION_GUARD]) {
    return;
  }

  const originalInsert = localCollection.insert;

  localCollection.insert = function insertWithoutHydrationDuplicates(
    document,
    ...args
  ) {
    try {
      return originalInsert.call(this, document, ...args);
    } catch (error) {
      const alreadyHydrated =
        error?.name === 'MinimongoError' &&
        error?.message?.startsWith('Duplicate _id') &&
        document?._id != null &&
        this.findOne(document._id);

      if (alreadyHydrated) return document._id;
      throw error;
    }
  };

  Object.defineProperty(localCollection, OFFLINE_HYDRATION_GUARD, {
    value: true,
  });
}
