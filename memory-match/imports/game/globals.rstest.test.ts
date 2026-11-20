/// <reference types="@rstest/core/globals" />

import { createDeck } from './shuffle';

test('filename marker owns a test using global Rstest APIs', () => {
  expect(createDeck('global-api')).toHaveLength(16);
});
