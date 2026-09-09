const OWNER_KEY = 'stock-scanner-owner-id';

export function getOwnerId() {
  if (typeof localStorage === 'undefined') return 'server-owner';

  const existing = localStorage.getItem(OWNER_KEY);
  if (existing) return existing;

  const ownerId = 'demo-stock-owner';
  localStorage.setItem(OWNER_KEY, ownerId);
  return ownerId;
}
