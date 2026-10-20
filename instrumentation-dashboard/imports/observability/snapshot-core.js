import { TERMINAL_METHOD_EVENTS, minuteOf } from './collector-core';

const MINUTE_MS = 60 * 1000;
export const SERIES_MINUTES = 60;

// Nearest-rank percentile of an ascending array.
export function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const rank = Math.ceil((p / 100) * sortedValues.length);
  return sortedValues[Math.max(0, rank - 1)];
}

function durationStats(durations) {
  const sorted = [...durations].sort((a, b) => a - b);
  return { p50: percentile(sorted, 50), p95: percentile(sorted, 95), p99: percentile(sorted, 99) };
}

// Everything the dashboard shows, computed from bounded reads.
export function computeSnapshot({ terminalEvents, recentEvents, rollups, instances, now, windowMs, staleMs = 10000 }) {
  const inWindow = terminalEvents.filter((event) =>
    TERMINAL_METHOD_EVENTS.includes(event.type) && event.ts >= now - windowMs);
  const calls = inWindow.length;
  const errors = inWindow.filter((event) => event.type === 'method.error').length;

  const byName = new Map();
  for (const event of inWindow) {
    const entry = byName.get(event.name) ?? { name: event.name, calls: 0, errors: 0, durations: [] };
    entry.calls += 1;
    if (event.type === 'method.error') entry.errors += 1;
    entry.durations.push(event.durationMs ?? 0);
    byName.set(event.name, entry);
  }
  const methods = [...byName.values()]
    .map(({ durations, ...entry }) => ({ ...entry, ...durationStats(durations) }))
    .sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name));

  const lastMinute = minuteOf(now);
  const series = Array.from({ length: SERIES_MINUTES }, (_, index) => ({
    minute: new Date(lastMinute - (SERIES_MINUTES - 1 - index) * MINUTE_MS),
    calls: 0,
    errors: 0,
  }));
  for (const rollup of rollups) {
    const index = SERIES_MINUTES - 1 - (lastMinute - new Date(rollup.minute).getTime()) / MINUTE_MS;
    if (index >= 0 && index < SERIES_MINUTES) {
      series[index].calls += rollup.calls;
      series[index].errors += rollup.errors;
    }
  }

  const liveInstances = instances
    .filter((instance) => new Date(instance.lastSeen).getTime() >= now - staleMs)
    .map(({ _id, connections = 0, publications = 0, dropped = 0 }) => ({ _id, connections, publications, dropped }));
  const sum = (field) => liveInstances.reduce((total, instance) => total + instance[field], 0);

  return {
    windowMs,
    calls,
    errors,
    errorRate: calls ? errors / calls : 0,
    ...durationStats(inWindow.map((event) => event.durationMs ?? 0)),
    methods,
    recent: recentEvents,
    series,
    instances: liveInstances,
    connections: sum('connections'),
    publications: sum('publications'),
    dropped: sum('dropped'),
  };
}
