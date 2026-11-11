# E2E tests

The Cypress suite contains 15 tests across four specs:

- `1.prepareTestEnvironment.cy.js`: clear the database and insert fixtures (2 tests).
- `authentication.cy.js`: registration, login, logout, and invalid credentials (5 tests).
- `navigation.cy.js`: default page and navigation between Tasks and About (3 tests).
- `tasks.cy.js`: task form, creation, completion, privacy, and deletion (5 tests).

The setup spec deletes all tasks and users. Run this suite against a disposable
development app/database, never against an instance with data you need to keep.
The authentication and task specs depend on setup and execute in filename order.

Install dependencies with `meteor npm install`. If the Cypress binary has not been
installed, run `npx cypress install`. Cypress is declared in `devDependencies` and
its version is recorded in the lockfile.

Start the disposable app with `meteor npm start`, then in another terminal run:

```bash
npm run e2e:headless
```

Use `npm run e2e` for the interactive runner. The default URL is
`http://localhost:3000`. To target a different disposable app and disable retries:

```bash
npm run e2e:headless -- --config baseUrl=http://localhost:3370,retries=0
```

Current gaps include guest/other-user authorization, toggling completion and
privacy back to their original state, and scheduled task expiration. Passing the
suite does not establish complete feature or code coverage.
