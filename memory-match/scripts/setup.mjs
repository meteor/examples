#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  appRoot,
  createSetupPlan,
  patchInstalledReactRefresh,
  prepareLocalPackages,
  resolveCheckout,
  withCheckoutEnvironment,
  writeCheckoutLauncher,
} from './checkout.mjs';

try {
  const checkout = resolveCheckout();
  console.log(`Meteor checkout: ${checkout.root} (${checkout.branch})`);
  prepareLocalPackages(checkout);
  for (const step of createSetupPlan({ checkout, appRoot })) {
    console.log(`\n$ meteor ${step.args.join(' ')}`);
    const result = spawnSync(step.command, step.args, {
      cwd: step.cwd,
      env: withCheckoutEnvironment(checkout),
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  if (patchInstalledReactRefresh()) {
    console.log('Applied React Refresh v2 compatibility to the installed Rspack package.');
  }
  writeCheckoutLauncher({ checkout, appRoot });
  console.log('\nReady. Run npm start, or npm run test:unit.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
