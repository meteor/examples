// One error line per site and per minute at most, so an outage does not flood the logs.
const lastLoggedAt = new Map();

export function logFailure(site, error) {
  const now = Date.now();
  if (now - (lastLoggedAt.get(site) ?? 0) < 60 * 1000) return;
  lastLoggedAt.set(site, now);
  console.error(`[observability] ${site} failed: ${error.message}`);
}
