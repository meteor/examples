# Task Manager

A task management app showcasing [Meteor-RPC](https://docs.meteor.com/community-packages/meteor-rpc.html) for type-safe methods and publications, [shadcn/ui](https://ui.shadcn.com/) components, and Tailwind CSS. Full CRUD with real-time reactivity, status and priority filters, and a live dashboard.

Demo: https://task-manager.sandbox.galaxycloud.app/

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4.1-rc.1 |
| Frontend | React 19 |
| UI | shadcn/ui (Radix + Tailwind) |
| Styling | Tailwind CSS 3 |
| Data | Meteor-RPC + React Query |
| Validation | Zod |
| Tests | Mocha |
| Code Quality | Biome |
| E2E | Playwright |
| Build | Rspack |

## Features

- Create, edit, and delete tasks
- Status management (To Do, In Progress, Done) with one-click cycling
- Priority levels (Low, Medium, High)
- Filter tasks by status and priority
- Real-time dashboard with task metrics

## Running it

```bash
meteor npm install
npm start
```

Visit `http://localhost:3000/`.

| Command | What it does |
|---|---|
| `npm start` | Start the app |
| `npm test` | Integration tests (Mocha, watch mode) |
| `npm run test:headless` | Integration tests (Mocha, headless/CI) |
| `npm run lint` | Lint and check formatting (Biome) |
| `npm run lint:fix` | Lint and auto-fix + format (Biome) |
| `npm run e2e` | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless) |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## How it's structured

```
imports/
  api/
    tasks.js        # Collection, Zod schemas, Meteor-RPC module (exports `_server`)
    client.js       # Client API (createClient)
  lib/
    utils.js        # cn() utility for Tailwind class merging
  ui/
    App.jsx         # Main app layout
    Dashboard.jsx   # Reactive metrics cards
    TaskList.jsx    # Task table with filters and actions
    TaskForm.jsx    # Create/edit dialog
    components/ui/  # shadcn/ui components
client/
  main.jsx          # Entry point with QueryClientProvider
  main.css          # Tailwind + shadcn/ui CSS variables
server/
  main.js           # Server entry (imports API module)
```

### shadcn/ui setup notes

Since shadcn/ui doesn't officially support Meteor, components are manually installed:

1. Radix UI primitives are installed as npm dependencies
2. Component source files are copied into `imports/ui/components/ui/`
3. The `cn()` utility uses `clsx` + `tailwind-merge`
4. Tailwind is configured with CSS custom properties for theming
5. Path alias `@` maps to `imports/` via Rspack config

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo`
- **Any Node.js host**: `meteor build` gives you a standard Node bundle
- **MUP**: automated deploy to your own server over SSH

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [React docs](https://react.dev/)
- [Meteor-RPC](https://docs.meteor.com/community-packages/meteor-rpc.html) · [shadcn/ui](https://ui.shadcn.com/) · [Tailwind CSS](https://tailwindcss.com/)
