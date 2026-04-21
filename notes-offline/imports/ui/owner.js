const STORAGE_KEY = 'notes-offline.ownerId';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `owner-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Anonymous per-device ownership: a stable id stored in localStorage.
// Losing localStorage means losing the link to notes on the server.
export function getOwnerId() {
  if (typeof localStorage === 'undefined') return 'anonymous';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
