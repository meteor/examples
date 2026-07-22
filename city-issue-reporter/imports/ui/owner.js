const OWNER_KEY = 'city-issue-reporter-owner-id';

export function getOwnerId() {
  if (typeof localStorage === 'undefined') return 'server-owner';

  const existing = localStorage.getItem(OWNER_KEY);
  if (existing) return existing;

  const ownerId = 'demo-civic-owner';
  localStorage.setItem(OWNER_KEY, ownerId);
  return ownerId;
}
