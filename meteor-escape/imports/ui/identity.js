import { Random } from 'meteor/random';

const IDENTITY_STORAGE_KEY = 'meteor-escape.identity.v1';

export function getClientIdentity() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return {
      ownerId: 'meteor-escape-owner',
      playerId: 'meteor-escape-player',
    };
  }

  const existing = window.localStorage.getItem(IDENTITY_STORAGE_KEY);

  if (existing) {
    try {
      const parsed = JSON.parse(existing);

      if (parsed?.ownerId && parsed?.playerId) {
        return parsed;
      }
    } catch {
      window.localStorage.removeItem(IDENTITY_STORAGE_KEY);
    }
  }

  const identity = {
    ownerId: Random.id(),
    playerId: Random.id(),
  };

  window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));

  return identity;
}
