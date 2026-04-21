const { formatter } = require('@lingui/format-json');

/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'es', 'pt'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/imports/locales/{locale}/messages',
      include: ['<rootDir>/imports', '<rootDir>/client'],
    },
  ],
  format: formatter({ style: 'minimal' }),
  compileNamespace: 'es',
};
