# Unit Tests

This folder contains unit tests

### Test Strategy

Some test may require dummy data, the responsibility of dummy data should not be on test. The test data is different
from dummy data. Test data will be stored and modified by tests.

### Test Plan

1. Application
    - [x] package.json has correct name
      
1. Meteor test
    - [x] client is not server
    - [x] server is not client

1. Task methods
    - [x] tasksInsert
    - [x] tasksRemove
    - [x] tasksUpdateAsChecked
    - [ ] tasksUpdateAsPrivate

### How to start tests

Type ```npm test``` into terminal

### Location of tests
The ```/test/main.js``` is the entry point of tests, and it 
includes tests that are related with application level
Other test are located in their own module folder and 
imported into the ```main.js```