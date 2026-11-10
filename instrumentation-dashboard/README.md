# Instrumentation Dashboard

An admin dashboard built on the `instrumentation` package that ships with Meteor 3.6. A small task app produces real traffic, and the `/admin` page shows method calls, latency percentiles, errors and DDP connections, computed from the package's lifecycle events.

The point is the pattern, not the charts: observing an app without slowing its methods down, keeping the stored data bounded, and serving the dashboard from any server instance.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.6 |
| Observability | `instrumentation` (Meteor core) |
| Frontend | Blaze 3 |
| Chart | Chart.js 4 |
| Database | MongoDB |
| Tests | Mocha (`meteortesting:mocha`), Playwright |
| Code Quality | RSLint |
| Build | Rspack |

## Running it

```bash
meteor npm install
npm start
```

Visit `http://localhost:3000/` for the task app and `http://localhost:3000/admin` for the dashboard.

| Command | What it does |
|---|---|
| `npm start` | Start the app |
| `npm test` | Unit and integration tests (Mocha, watch mode) |
| `npm run test:headless` | Unit and integration tests (Mocha, headless/CI) |
| `npm run visualize` | Bundle analyzer in production mode |
| `npm run lint` | Lint (RSLint) |
| `npm run lint:fix` | Lint and auto-fix (RSLint) |
| `npm run e2e` | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless) |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## What it does

- The task app (`/`) adds, checks and removes tasks through methods and a publication: that is the traffic being observed.
- The dashboard (`/admin`) shows, for the last 5 minutes, the number of method calls, the p95 duration, the error rate and the open DDP connections, a per-method table (calls, errors, p50, p95), a chart of calls and errors per minute over the last hour, and the 50 most recent events.
- Clicking an event opens its payload as JSON text.
- In development, **Generate sample traffic** makes twenty method calls, three of which fail validation on purpose.

## How it works

```text
task app (/)                                  dashboard (/admin)
  methods and publications
        │ instrumentation events
        ▼
  collector, in each server process
    listener: push onto a bounded in-memory queue (no I/O)
        │ flush every 250 ms, bulk writes
        ├─▶ instrumentation_events      capped collection, MongoDB keeps the newest
        ├─▶ instrumentation_rollups     calls and errors per minute and method, TTL 24 h
        └─▶ instrumentation_instances   one heartbeat per process (connections, subscriptions)
        │ every 2 s, one process recomputes the summary
        ▼
  instrumentation_snapshot { _id: 'live' } ──▶ publication admin.snapshot ──▶ Blaze
```

- **Nothing on the hot path.** The listeners run inside the observed method, so they only push the event onto a queue. All writes happen in the periodic flush.
- **Bounded everywhere.** The queue drops its oldest events when full and counts them (the dashboard shows the count), the events collection is capped, and rollups expire after 24 hours.
- **Exact counts, sampled durations.** The calls and errors of the window are counted over every stored event. The percentiles come from the newest 2,000 calls, and the dashboard says so when the window holds more.
- **Counters survive write failures.** Once the raw events are stored, their per-minute counters wait in memory until the rollup write succeeds. After a partial failure only the operations MongoDB reported as failed are retried.
- **Several instances.** Every process writes into the same collections, tagged with its instance id. A compare-and-set lease on the snapshot document lets one process recompute the summary each round without a leader election, and any process can serve the dashboard.
- **One document to publish.** The dashboard subscribes to a single summary document: counts, percentiles, the chart series and the 50 most recent events. Viewers never subscribe to the raw collections.
- **Private by default.** Client IP addresses are not captured. Method arguments are not captured either, except for a projection on `tasks.insert` that records the length of the text, never the text itself (`imports/observability/policy.js`). The recent events do carry user ids, error messages and instance names, for the people `requireAdmin()` lets in.

## How it's structured

```
client/
  main.html, main.js    # Layout and the two pages, chosen by path
  main.css
server/
  main.js               # Starts the collector, publishes admin.snapshot
imports/
  admin/
    authorization.js    # requireAdmin(): the single place to plug real permissions
  api/tasks/            # Tasks collection, methods and publication
  observability/
    policy.js           # Instrumentation.configure() and the tasks.insert projection
    collector-core.js   # Pure helpers: event documents, bounded queue, rollups
    collector.js        # Listeners, periodic flush and heartbeat
    snapshot-core.js    # Pure summary computation (percentiles, series, instances)
    snapshot.js         # Bounded reads and the compare-and-set refresh
    server.js           # Storage setup (capped collection, TTL indexes) and startup
    settings.js         # Defaults, overridable in settings.json
  ui/                   # Tasks page, admin page and chart
tests/                  # Unit tests and a server integration test (Mocha)
e2e/                    # Playwright specs
```

## In production

- **Permissions.** `requireAdmin()` allows everyone because this example has no accounts. Replace it with a role check, for example `Roles.userIsInRoleAsync(userId, 'admin')` with the `roles` package from Meteor core.
- **Sizes.** `settings.json` controls the capped collection size, the window, the flush and refresh intervals, the rollup retention and the queue size. The capped collection is created on the first start and keeps its size afterwards; a new rollup retention is applied to the existing index at the next start. Set `observability.enabled` to `false` to stop collecting, or `METEOR_INSTRUMENTATION_DISABLED=1` to turn the events off entirely.
- **OpenTelemetry.** To send traces and metrics to an OpenTelemetry backend instead, the `meteor-otel` package (in review, [meteor/meteor#14086](https://github.com/meteor/meteor/pull/14086)) consumes the same events.

## Limits

- Events still in the queue when the process stops are lost, and so are the counters of stored events whose rollup write has not happened yet.
- Counters waiting for a rollup write stay in memory without bound while that write keeps failing.
- Instances share the refresh through timestamps, so a clock far ahead of the others monopolises it.
- The subscription count per instance is approximate: it counts publication starts minus stops and errors.
- The trace and span ids are the package's own ids, not OpenTelemetry ids.
- The window counts cover the events the capped collection still holds (up to 20,000 events or 5 MB by default); the header says since when they are kept. The percentiles cover the newest 2,000 calls.
- Writes are at-least-once: a write lost in flight after MongoDB applied it is retried, so the events or counters it carried can be stored twice.

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com --settings settings.json`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo --settings settings.json`
- **Any Node.js host**: `meteor build` gives you a standard Node bundle

## Links

- [Meteor docs](https://docs.meteor.com/) · [Instrumentation API](https://docs.meteor.com/api/instrumentation)
- [Blaze docs](https://www.blazejs.org/)
- [Chart.js](https://www.chartjs.org/)
