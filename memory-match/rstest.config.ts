import path from 'node:path';
import { defineConfig } from '@meteorjs/rstest';
import { defineInlineProject } from '@rstest/core';

export default defineConfig((context) => {
  return {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    testTimeout: context.fullApp ? 45_000 : 10_000,
    hookTimeout: 15_000,
    maxConcurrency: 2,
    setupFiles: [
      path.join(context.appRoot, 'tests/setup/common.ts'),
      path.join(context.appRoot, 'tests/setup/dom.ts'),
    ],
    env: {
      NODE_ENV: 'development',
      SHOWCASE_CONFIG_PHASE: context.phase,
      SHOWCASE_CONFIG_APP_ROOT: context.appRoot,
    },
    browser: {
      provider: 'playwright',
      browser: 'chromium',
      headless: process.env.SHOWCASE_HEADED !== '1',
      viewport: { width: 1280, height: 800 },
    },
    coverage: {
      provider: 'istanbul',
      allowExternal: true,
      include: [
        path.join(context.appRoot, 'imports/game/**/*.{ts,tsx}'),
        path.join(context.appRoot, 'imports/ui/**/*.{ts,tsx}'),
        path.join(context.appRoot, 'packages/memory-match-engine/**/*.{ts,tsx}'),
      ],
      exclude: [
        path.join(context.appRoot, 'imports/game/rstest-env.d.ts'),
        '**/*.d.ts',
        '**/*.{test,spec}.{ts,tsx}',
        '**/__snapshots__/**',
      ],
      reportsDirectory: path.join(context.appRoot, 'coverage'),
      reporters: ['text', 'html', 'json-summary'],
    },
    performance: { buildCache: true },
    tools: {
      rspack(config) {
        const rules = config.module?.rules ?? [];
        if (config.module) {
          config.module.rules = rules.filter((rule) => !(
            typeof rule === 'object'
            && rule
            && 'type' in rule
            && rule.type === 'css/auto'
          ));
        }
        for (const rule of rules) {
          if (
            typeof rule === 'object'
            && rule
            && 'loader' in rule
            && rule.loader === 'builtin:swc-loader'
          ) {
            const options = rule.options as {
              jsc?: {
                transform?: {
                  react?: { refresh?: boolean; runtime?: 'automatic' | 'classic' };
                };
              };
            } | undefined;
            if (options?.jsc?.transform?.react) {
              options.jsc.transform.react.refresh = false;
              options.jsc.transform.react.runtime = 'automatic';
            }
          }
        }
        return config;
      },
    },
    projects: context.phase === 'native'
      ? [defineInlineProject({
          name: 'showcase-in-source',
          root: path.join(context.appRoot, 'imports/game'),
          includeSource: ['shuffle.ts'],
          testEnvironment: 'node',
        })]
      : [],
  };
});
