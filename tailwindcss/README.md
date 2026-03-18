# Task Manager

A Meteor 3.4 example app demonstrating a dynamic task management system with:

- **Meteor-RPC** for type-safe methods and publications with Zod validation
- **shadcn/ui** components (manually installed) for a polished UI
- **Tailwind CSS** with CSS custom properties for theming
- **React Query** integration via Meteor-RPC hooks
- **MongoDB** collection with full CRUD operations and real-time reactivity
- **Rspack** as the bundler

## Features

- Create, edit, and delete tasks
- Status management (To Do, In Progress, Done) with one-click cycling
- Priority levels (Low, Medium, High)
- Filter tasks by status and priority
- Real-time dashboard with task metrics
- Responsive design

## Tech Stack

| Technology | Purpose |
|---|---|
| [Meteor 3.4](https://docs.meteor.com) | Full-stack framework |
| [Meteor-RPC](https://docs.meteor.com/community-packages/meteor-rpc.html) | Type-safe methods & publications |
| [shadcn/ui](https://ui.shadcn.com) | UI components (Radix + Tailwind) |
| [Tailwind CSS 3](https://tailwindcss.com) | Utility-first styling |
| [React Query](https://tanstack.com/query) | Server state management |
| [Zod](https://zod.dev) | Schema validation |
| [Rspack](https://rspack.dev) | Bundler |

## Project Structure

```
imports/
  api/
    tasks.js        # Collection, Zod schemas, Meteor-RPC module
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
  main.html         # HTML template
server/
  main.js           # Server entry (imports API module)
```

## Running the example

### Install dependencies

```bash
meteor npm install
```

### Start the app

```bash
meteor
```

The app will be available at `http://localhost:3000`.

## shadcn/ui Setup Notes

Since shadcn/ui doesn't officially support Meteor, components are manually installed:

1. Radix UI primitives are installed as npm dependencies
2. Component source files are copied into `imports/ui/components/ui/`
3. The `cn()` utility uses `clsx` + `tailwind-merge`
4. Tailwind is configured with CSS custom properties for theming
5. Path alias `@` maps to `imports/` via Rspack config
