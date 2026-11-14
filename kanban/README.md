# Kanban

A real-time kanban board built with Blaze 3.1 (beta) and the web platform. Cards move by native drag and drop, the editor is a `<dialog>`, menus and toasts are popovers, pasting a list creates cards, moves are animated with the View Transition API, and the header chart is a custom element fed from an autorun. No UI library, no jQuery, no router package.

Open a board in two tabs: every change shows up in both.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.6 |
| Frontend | Blaze 3.1 beta, without jQuery (`blaze-html-templates@3.1.0-beta.0`) |
| UI | Plain CSS: nesting, `light-dark()`, `::backdrop`, `::view-transition` |
| Database | MongoDB |
| Code Quality | RSLint |
| Tests | Mocha |
| E2E | Playwright |
| Build | Rspack |

## Running it

```bash
meteor npm install
npm start
```

Visit `http://localhost:3000/`.

| Command | What it does |
|---|---|
| `npm start` | Start the app |
| `npm test` | Unit and method tests (Mocha, watch mode) |
| `npm run test:headless` | Unit and method tests (Mocha, headless/CI) |
| `npm run visualize` | Bundle analyzer in production mode |
| `npm run lint` | Lint (RSLint) |
| `npm run lint:fix` | Lint and auto-fix (RSLint) |
| `npm run e2e` | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless) |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## What it does

- Create a board, share its URL; anyone with the link can edit it
- Add cards by typing, or paste a list to create one card per line
- Drag cards between columns and reorder them
- Move a card to another column from its editor, with the keyboard too; reordering inside a column still needs a pointer
- Edit a card in a dialog, copy a link that opens it directly, delete it
- Rename, add and delete columns
- Copy the board's link, or share it with the Web Share API where that exists

## Where each platform API is used

| API | Where | Blaze side |
|---|---|---|
| Drag and Drop | `imports/ui/board.js`, `dragstart` / `dragover` / `drop` | `event.dataTransfer` is on the event itself, no `originalEvent` |
| View Transitions | `moveCard` in `imports/ui/board.js` | the Method stub runs inside the callback, then `Tracker.flush()` so the new state is captured |
| `<dialog>` | `cardEditor` template | `method="dialog"`, `event.submitter`, `closedby="any"`; `close` does not bubble but the event map still gets it |
| Popover | column menus and the toast | `popovertarget` set from a helper, `popover="manual"` for the toast |
| CSS Anchor Positioning | `.menu` in `client/main.css` | the menu buttons share one anchor name and `anchor-scope` on the column header keeps each menu under its own button; `position-try-fallbacks: flip-inline` hangs a menu from its button's left edge when there is no room on the left; centered where `anchor-scope` is missing |
| Clipboard | `paste` on the new-card input, copy link buttons | `event.clipboardData`, `navigator.clipboard.writeText` |
| Web Share | header `Share` button | rendered only when `navigator.share` exists |
| Custom element | `<board-chart>` in `imports/ui/board-chart.js` | fed through a property from `onRendered` + `autorun`; attributes would only carry strings |
| Async helpers (Blaze 2.7+) | `siteStats` on the landing page | `#let` unwraps the Promise, `@pending` / `@rejected` / `@resolved` drive the markup |
| `history` + `popstate` | `imports/ui/app.js` | a reactive copy of the path picks the page |

Browser support: per MDN compatibility data, every API in the table is in Chrome and Edge 134, Firefox 147 and Safari 27.3, Web Share aside. Desktop Firefox and Chrome on Linux have no Web Share, so the Share button is not rendered there. Safari 26 to 27.2 lack only `closedby`: Escape and the buttons close the editor, a click outside does not. Without `anchor-scope` the column menu is centered; without View Transitions a card moves with no animation.

## How it's structured

```
client/
  main.html             # Shell HTML
  main.js               # Entry: methods (for stubs), templates and styles
  main.css              # Plain CSS, light and dark
server/
  main.js               # Methods and the board publication
imports/
  api/
    boards/             # Boards collection, methods, publication
    cards/              # Cards collection, methods, rank and title helpers
  ui/
    app.js              # Page choice from the path
    landing.js          # Board creation, async stats helper
    board.js            # Board, columns, cards, card editor
    board-chart.js      # The <board-chart> custom element
tests/                  # Mocha: pure helpers and methods
e2e/                    # Playwright: cards, columns, drag and drop, editor, links, live update
```

## Related examples

[Simple Blog](https://github.com/dupontbertrand/meteor-blog) shows accounts, roles and permissions, and email with Blaze; [Parties](../parties) shows a D3 map and optimistic updates.

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo`
- **Any Node.js host**: `meteor build` gives you a standard Node bundle
- **MUP**: automated deploy to your own server over SSH

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [Blaze docs](https://www.blazejs.org/)
- MDN: [Drag and Drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) · [View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) · [Popover](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) · [Anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning) · [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
