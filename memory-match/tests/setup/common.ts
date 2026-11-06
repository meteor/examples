import { afterEach, rs } from '@rstest/core';

afterEach(() => {
  rs.restoreAllMocks();
  rs.unstubAllEnvs();
  rs.unstubAllGlobals();
});
