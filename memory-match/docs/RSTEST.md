# Rstest integration details

Memory Match is a release-readiness showcase for the Meteor Rstest integration.
The main [README](../README.md) explains how to run the app. This document
explains what the test suite demonstrates and records the temporary checkout
setup that will disappear after publication.

## Current prerelease arrangement

`@meteorjs/rstest` and the matching Rspack integration are loaded from the
Meteor checkout on `rspack-rstest-integration`. `npm run setup` validates the
checkout, links the two local packages through ignored paths under
`.meteor/local/npm`, installs the app dependencies, and writes the temporary
`meteor-checkout` launcher. The launcher preserves normal Meteor arguments and
adds the local package paths required by this branch.

The project intentionally does not pretend that released packages are available.
Its published-version migration should happen in the release PR, after the
Meteor release and npm packages exist:

1. Replace `file:.meteor/local/npm/...` dependencies with the published,
   compatible `@meteorjs/rspack` and `@meteorjs/rstest` versions.
2. Replace `meteor-checkout` scripts with ordinary `meteor` commands and remove
   the temporary setup/launcher code and its tests.
3. Change CI from a source checkout to the released Meteor version, then run the
   complete test matrix before merging.
4. Remove the prerelease note in the README and record the released Meteor
   version in the examples index.

Until then, the checkout requirement is a short, explicit warning in the README
instead of the example's permanent identity.

## Test execution

Meteor continues to own application and runtime concerns: command parsing,
Isobuild, Atmosphere compilation, MongoDB, DDP, application hosts, ports,
shutdown, and aggregated results. Rstest owns collection, Rspack test
compilation, assertions, fixtures, snapshots, coverage, Browser Mode,
Playwright fixtures, and native workers.

Tests are organized with their app domain. Dependency analysis selects an
executor, and filename markers settle the cases where imports cannot describe
the necessary host:

| Test kind | Example | Signal | Execution |
|---|---|---|---|
| Native unit | `imports/game/snapshots.test.ts` | `@rstest/core` | Rstest in Node |
| Browser Mode | `imports/ui/MemoryGame.interactions.test.tsx` | `@rstest/browser` | Rstest in Chromium |
| Meteor runtime | `imports/api/runtime-context.test.ts` | `meteor/*` import | Real Meteor server/client hosts |
| External E2E | `tests/e2e/memory-game.test.ts` | `@rstest/playwright` | Playwright against a Meteor-owned app |
| Atmosphere package | `packages/memory-match-engine` | `Package.onTest` uses `rstest` | Real local package harness |

Fallback markers demonstrate the remaining explicit ownership cases:

| Need | Example | Marker |
|---|---|---|
| Global Rstest APIs | `imports/game/globals.rstest.test.ts` | `.rstest.test` |
| jsdom instead of Node | `imports/ui/MemoryGame.dom.rstest.test.tsx` | `.dom.rstest.test` |
| Server-only Meteor host | `imports/api/methods.server.meteor.rstest.test.ts` | `.server.meteor.rstest.test` |
| Client-only Meteor host | `imports/ui/App.client.meteor.rstest.test.tsx` | `.client.meteor.rstest.test` |

`imports/game/shuffle.ts` also demonstrates an in-source test through
`import.meta.rstest`. The one test below `tests/rstest/pure` remains as a
compatibility-root example.

## Adding a feature or test

Keep new behavior and its tests together. Choose the lightest test environment
that exercises the behavior:

| Change | Add tests in | Run |
|---|---|---|
| Game rules or scoring | `imports/game/`, importing `@rstest/core` | `npm run test:unit` |
| React component behavior | `imports/ui/`, with a `.dom.rstest.test.tsx` marker for jsdom or an `@rstest/browser` import for Chromium | `npm run test:component` or `npm run test:browser` |
| Methods, publications, or subscriptions | `imports/api/`, importing real `meteor/*` modules and using a server/client marker when needed | `npm run test:integration` |
| Complete user journey | `tests/e2e/`, importing `@rstest/playwright` | `npm run test:e2e` |
| Local Atmosphere package | `packages/`, with a strong `rstest` dependency in `Package.onTest` | `npm run test:package` |

Use `npm run typecheck` and the relevant test command while working; run
`npm run test:coverage` when a change crosses several layers. If a new test
needs its own project, give it a distinct name in `rstest.config.ts` and verify
the project selection with a focused run.

## Useful options

Filter by name or shard through the npm shortcut. Select one project for a
single-file run; `test:unit` also selects the in-source project. Native Rstest
reporter options go after a second `--`, which tells Meteor to pass them through:

```bash
npm run test:unit -- --test-name-pattern deck
./meteor-checkout test --once --server-only --project meteor-pure-server --test-file imports/game/score.test.ts
npm run test:unit -- -- --reporters=verbose
npm run test:unit -- --shard 1/2

SHOWCASE_HEADED=1 npm run test:browser
SHOWCASE_HEADED=1 npm run test:e2e
```

Update a snapshot with the direct Meteor command:

```bash
./meteor-checkout test --once --server-only \
  --project meteor-pure-server \
  --test-file imports/game/snapshots.test.ts \
  --update-snapshots
```

## Coverage and parallel execution

`npm run test:coverage` combines native tests, real Meteor server/client
tests, the local package, and Playwright E2E into one Istanbul report. It writes
`coverage/index.html` and `coverage/coverage-summary.json`. Failure screenshots
go to `reports/failures`, and E2E traces are retained on failure.

`test:parallel:native` uses Rstest file workers. `test:parallel:meteor` starts
two isolated Meteor server-runtime workers, each with its own build directory,
port, and MongoDB. The latter is intentionally an explicit command rather than
the default because runtime workers are a different scheduling layer.

## Configuration boundaries

`rstest.config.ts` uses `defineConfig` from `@meteorjs/rstest`. Meteor supplies
the runtime context and generated file manifests; the app adds common setup,
timeouts, Browser Mode, coverage, an in-source project, and test-safe Rspack
adjustments. `rspack.config.ts` only adds application behavior. Meteor aliases,
entries, lifecycle plugins, and Atmosphere handling remain integration-owned.
