Package.describe({
  name: 'ostrio:logger',
  version: '2.0.9', // couldn't change the version because the other dependencies of logger
  summary: 'Logging: isomorphic driver with support of MongoDB, File (FS) and Console',
  git: 'https://github.com/VeliovGroup/Meteor-logger',
  documentation: 'README.md'
});

Package.onUse((api) => {
  api.versionsFrom('1.4');
  api.use(['ecmascript', 'reactive-var', 'check'], ['client', 'server']);
  api.mainModule('logger.js', ['client', 'server']);
});

Package.onTest((api) => {
  api.use('tinytest');
  api.use(['ecmascript', 'underscore', 'ostrio:logger']);
  api.addFiles('logger-tests.js');
});
