# Team Appointments

A shared appointment book for a small team, built with Blaze 3.1 (beta) and three
Blaze packages: a calendar driven by Minimongo, a table sorted and searched on the
server, and live presence. Everyone sees the same appointments, who else is on the
page, their pointer, and which appointment they have open. Roles from Meteor's core
`roles` package decide who changes what.

Open the app in two browsers and sign in as two people from the header: every
change, pointer and open editor shows up in the other one.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.6 |
| Frontend | Blaze 3.1 beta, without jQuery (`blaze-html-templates@3.1.0-beta.0`) |
| Calendar | [`dupontbertrand:calendar`](https://github.com/dupontbertrand/blaze-calendar) |
| Table | [`dupontbertrand:table`](https://github.com/dupontbertrand/blaze-table) |
| Presence | [`dupontbertrand:presence`](https://github.com/dupontbertrand/blaze-presence) |
| Permissions | `roles` (Meteor core) and `accounts-password` |
| Database | MongoDB, live updates through change streams |
| Code Quality | RSLint |
| Tests | Mocha |
| E2E | Playwright |
| Build | Rspack |

## Running it

```bash
meteor npm install
npm start
```

Visit `http://localhost:3000/`. The app signs you in as Maya; switch user from the
header. Every demo password is `demo`.

| Command | What it does |
|---|---|
| `npm start` | Start the app |
| `npm test` | Method and unit tests (Mocha, watch mode) |
| `npm run test:headless` | Method and unit tests (Mocha, headless/CI) |
| `npm run visualize` | Bundle analyzer in production mode |
| `npm run lint` | Lint (RSLint) |
| `npm run lint:fix` | Lint and auto-fix (RSLint) |
| `npm run e2e` | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless) |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## What it does

- A week, month or day calendar of the team's appointments, one colour per person
- Select empty time to add an appointment, drag it to move it, drag its edge to resize it, click it to edit its title, client and notes
- A list page with every appointment, sorted, searched and paged by the server, filtered to yours or to upcoming ones
- The header shows who else is on the same page; on the calendar, their pointers move over it, and an appointment someone has open says so
- A save made on an outdated version is refused, and the editor offers the newer one
- Four accounts and three roles: an admin changes everything, members change their own appointments, the viewer changes nothing

| Account | Role |
|---|---|
| Maya Chen (`maya`) | admin |
| Leo Martin (`leo`), Sara Ali (`sara`) | member |
| Tom Becker (`tom`) | viewer |

## How it's structured

```
imports/api/
  appointments.js   collection, Methods (loaded on both sides), the table's definition
  permissions.js    who may change what: one rule, sync on the client, async on the server
  team.js           the demo accounts, the pages and their presence rooms
imports/ui/
  app.*             header, pages chosen by the address (#calendar, #list), sign in
  calendar.*        the calendar inside a presence area, the event template
  list.*            the table, its filters, the owner cell
  editor.*          the appointment dialog
  state.js          the page, the open appointment, the error line
server/
  main.js           publications, table rules, presence rooms, accounts and roles
  seed.js           a fortnight of appointments around today
```

## How the packages fit together

| Package | Where | What to look at |
|---|---|---|
| Calendar | `imports/ui/calendar.js` | `onMove` returns the `Meteor.callAsync` promise: the stub moves the appointment at once, a refusal from the server moves it back. `onRange` drives the subscription to the range on screen. `canMove` and `canSelect` use the same permission rule as the server. |
| Table | `appointmentsTable` in `imports/api/appointments.js`, `publish` in `server/main.js` | One definition for both sides; the server decides which rows each user sees and checks the filter sent by the browser. Only the page on screen reaches the browser. |
| Presence | `page.presence` in `server/main.js`, `imports/ui/app.js` | Being on a page is subscribing to its room: the app's publication checks the role, then calls `Presence.publish`. The editor adds `{ editing: id }` to what the others see, which the calendar's event template reads. |
| Roles | `imports/api/permissions.js` | The roles package publishes nothing: the app publishes each user's own assignments for `Roles.userIsInRole` on the client. |

Appointments carry a `revision`, a random id the server draws on every change.
Every move or edit sends the revision the user saw; if someone changed the
appointment in between, the server refuses with `stale` and the stub is rolled
back. Stubs leave the revision alone, so a client never holds one the server has
not issued. Deleting takes no revision.

Names and colours live in each user's `profile`, which Meteor lets a user change
unless the app denies it: `server/main.js` does, so nobody can take a teammate's
name in the presence avatars.

`npm test` runs in the `America/Los_Angeles` time zone, west of UTC, where a date
bug on whole-day appointments shows up.

Whole-day appointments are stored as UTC midnights with the end excluded, as the
calendar does, so they stay on the same day in every time zone.

The calendar computes dates with Temporal. Browsers without it (Safari before
27.3) load `temporal-polyfill` from a chunk of its own: see `client/main.js`.
