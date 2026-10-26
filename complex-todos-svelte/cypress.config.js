module.exports = {
  projectId: 'ctdsm1',
  allowCypressEnv: false,
  e2e: {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000/',
    supportFile: 'cypress/support/e2e.js',
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    pageLoadTimeout: 120000,
    responseTimeout: 60000,
    retries: {
      runMode: 0,
      openMode: 0,
    },
    watchForFileChanges: true,
  },
};
