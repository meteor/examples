import { expect, test } from '@rstest/core';
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { App } from './App';

test('App mounts inside real Meteor browser runtime', async () => {
  expect(typeof window.localStorage).toBe('object');
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  flushSync(() => root.render(<App />));
  expect(container.textContent).toContain('Memory Match');
  expect(container.querySelector('input')?.getAttribute('aria-label')).toBeNull();
  root.unmount();
  container.remove();
});
