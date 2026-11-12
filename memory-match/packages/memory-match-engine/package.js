Package.describe({
  name: 'memory-match-engine',
  version: '0.0.1',
  summary: 'Local package example for Meteor Rstest package tests',
});

Package.onUse((api) => {
  api.versionsFrom('3.4');
  api.use(['ecmascript', 'typescript']);
  api.mainModule('engine.ts');
  api.addAssets('meteor.d.ts', 'server');
});

Package.onTest((api) => {
  api.versionsFrom('3.4');
  api.use([
    'ecmascript',
    'typescript',
    'mongo',
    'rstest',
    'memory-match-engine',
  ]);
  api.mainModule('engine.tests.ts');
});
