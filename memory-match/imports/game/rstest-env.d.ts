import type { expect, test } from '@rstest/core';

declare global {
  interface ImportMeta {
    readonly rstest?: {
      readonly expect: typeof expect;
      readonly test: typeof test;
    };
  }
}

export {};
