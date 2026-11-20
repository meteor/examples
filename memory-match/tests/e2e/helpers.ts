import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect } from '@rstest/playwright';
import type { Page } from 'playwright';

import { createDeck } from '../../imports/game/shuffle';

export const baseUrl = process.env.METEOR_RSTEST_BASE_URL;

export function requireBaseUrl(): string {
  if (!baseUrl) throw new Error('METEOR_RSTEST_BASE_URL was not provided');
  return baseUrl;
}

export function failureScreenshotPath(taskId: string): string {
  const safeId = taskId.replace(/[^a-z0-9._-]+/gi, '-');
  const destination = path.resolve('reports/failures', `${safeId}.png`);
  mkdirSync(path.dirname(destination), { recursive: true });
  return destination;
}

export async function completeGame(page: Page, seed: string): Promise<void> {
  const cards = page.getByRole('grid', { name: 'Memory cards' }).getByRole('button');
  const groups = new Map<string, number[]>();
  createDeck(seed).forEach((card, index) => groups.set(card.symbol, [
    ...(groups.get(card.symbol) ?? []),
    index,
  ]));

  let pairNumber = 0;
  for (const [first, second] of groups.values()) {
    await cards.nth(first).click();
    await expect(cards.nth(first)).toHaveAttribute('data-state', 'revealed');
    await cards.nth(second).click();
    pairNumber += 1;
    await expect(page.locator('.memory-card[data-state="matched"]'))
      .toHaveCount(pairNumber * 2);
  }
}
