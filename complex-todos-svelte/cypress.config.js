module.exports = {
  projectId: 'ctdsm1',
  allowCypressEnv: false,
  e2e: {
    baseUrl: 'http://localhost:3000/',
    supportFile: 'cypress/support/e2e.js',
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    pageLoadTimeout: 120000,
    responseTimeout: 60000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    watchForFileChanges: true,
  },
};
