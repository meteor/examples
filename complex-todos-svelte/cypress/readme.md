# E2E Tests

This folder contains e2e tests

### Test Strategy

Some test may require dummy data, the responsibility of dummy data should not be on cypress. The test data is different
from dummy data. Test data will be stored and modified by cypress.

### Test Plan

1. Authentication
    - [x] Sign up - Fail - Passwords must match
    - [x] Sign up - Fail - Password must long
    - [x] Sign up - Success
    - [x] Sign in - Fail - Incorrect password
    - [x] Sign in - Fail - User not found
    - [x] Sign in - Success
    - [ ] Sign out

1. Navigation
    - [ ] Go to tasks page
    - [ ] Go to about page

1. Task
    - [ ] Guest can not see the new task form
    - [ ] Insert a new task
    - [ ] Update a task as checked
    - [ ] Update a task as unchecked
    - [ ] Update a task as private
    - [ ] Update a task as public
    - [ ] Remove a task
    - [ ] Check if a task is expired

### How to start tests

Type ```npm run cypress``` into terminal

### Location of tests

If cypress cache exists after file change, delete
~/Library/Application Support/Cypress/cy