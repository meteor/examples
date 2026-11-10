import { minuteOf } from './collector-core';

const MINUTE_MS = 60 * 1000;
export const SERIES_MINUTES = 60;
// Percentiles are computed from the newest calls of the window, at most this many.
export const LATENCY_SAMPLE_SIZE = 2000;

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

// Everything the dashboard shows, computed from bounded reads. `totals` counts
// every terminal event of the window per method and type; `latencySample` holds
// the newest ones, so the percentiles describe a sample when the window is larger.
export function computeSnapshot({
  totals, latencySample, recentEvents, rollups, instances, now, windowMs, staleMs = 10000,
}) {
  const byName = new Map();
  const methodOf = (name) => {
    if (!byName.has(name)) byName.set(name, { name, calls: 0, errors: 0, durations: [] });
    return byName.get(name);
  };
  for (const { name, type, count } of totals) {
    const entry = methodOf(name);
    entry.calls += count;
    if (type === 'method.error') entry.errors += count;
  }
  for (const event of latencySample) methodOf(event.name).durations.push(event.durationMs ?? 0);
  const methods = [...byName.values()]
    .map(({ durations, ...entry }) => ({ ...entry, ...durationStats(durations) }))
    .sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name));
  const calls = methods.reduce((total, method) => total + method.calls, 0);
  const errors = methods.reduce((total, method) => total + method.errors, 0);

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
    ...durationStats(latencySample.map((event) => event.durationMs ?? 0)),
    sampleSize: latencySample.length,
    sampled: calls > latencySample.length,
    methods,
    recent: recentEvents,
    series,
    instances: liveInstances,
    connections: sum('connections'),
    publications: sum('publications'),
    dropped: sum('dropped'),
  };
}
