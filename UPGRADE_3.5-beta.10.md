# Meteor 3.4.1 → 3.5-beta.10 Upgrade

**Branch:** `update-meteor-3.5-beta.10`

## Version Updates

- `.meteor/release` → `METEOR@3.5-beta.10` in all 6 internal examples
  (tic-tac-toe, notes-offline, task-manager, parties, complex-todos-svelte, nft-marketplace)
- `meteor update --release 3.5-beta.10` refreshed each project's `.meteor/versions` and `.meteor/packages`
  (core packages now on `*-beta350.10` pre-releases; `rspack`, `ecmascript`, `typescript`, `hot-module-replacement`, `standard-minifier-css` dropped their `-rc341.1` suffix)
- Root `README.md` (6 entries) and `examples.json` (5 entries): `3.4.1` → `3.5-beta.10`,
  `lastUpdatedAt` bumped to `May/06/2026`
- Per-project `README.md` runtime label updated for the 5 projects that document it
  (`3.4.1-rc.1` → `3.5-beta.10` in tic-tac-toe, notes-offline, task-manager, parties, complex-todos-svelte)
- `notes-offline/README.md` re-formatted with Prettier (table column padding); previously failed
  `npm run lint` on `main`
- No npm dependency changes; `@meteorjs/rspack` stays at `^2.0.1`

## Test Results - All Green

| Project              | Lint | Mocha | Playwright | Cypress |
| -------------------- | :--: | :---: | :--------: | :-----: |
| tic-tac-toe          |  OK  |  6/6  |    6/6     |    -    |
| notes-offline        |  OK  |  9/9  |   13/13    |    -    |
| task-manager         |  OK  |  6/6  |    9/9     |    -    |
| parties              |  OK  |  5/5  |    8/8     |    -    |
| complex-todos-svelte |  OK  |  5/5  |     -      |  15/15  |
| nft-marketplace      |  -   |  2/2  |     -      |    -    |

**Totals:** lint clean on all 5 projects that ship a lint script, 33 unit/integration tests,
36 Playwright E2E tests, 15 Cypress E2E tests - 84/84 passing.

Notes:
- nft-marketplace has no `lint` script and no E2E suite, matching the 3.4.1 upgrade scope.
- The first parties Playwright run had one flaky failure on the D3 map circle interaction
  (`should RSVP to a party`); a second run was 8/8 clean.
- Pre-existing lint warnings (3 in tic-tac-toe, 2 in notes-offline, 2 in complex-todos-svelte,
  1 Biome broken-symlink notice in task-manager) are unchanged - all linters exit 0.

## Files Changed

- `README.md`, `examples.json`, `UPGRADE_3.5-beta.10.md`
- For each of the 6 examples: `.meteor/release`, `.meteor/versions`, `.meteor/packages`
- Per-project `README.md` for the 5 projects that document the runtime version

## Notes

- Untracked `complex-todos-svelte/SVELTE_LOADER.md` and `UPGRADE_3.4.1.md` predate this task and
  were left alone.
- External examples (Simple Tasks, Simple Blog, Welcome Meteor Cordova) live in their own
  repositories; their `meteorVersion` entries in `examples.json` / `README.md` were left at their
  current values.
