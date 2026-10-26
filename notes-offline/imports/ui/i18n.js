import { i18n } from '@lingui/core';
import { messages as en } from '../locales/en/messages.mjs';
import { messages as es } from '../locales/es/messages.mjs';
import { messages as pt } from '../locales/pt/messages.mjs';

// Include catalogs in the cached app bundle for offline page reloads.
const catalogs = { en, es, pt };

export const SUPPORTED_LOCALES = ['en', 'es', 'pt'];
const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'notes-offline.locale';

export function detectLocale() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    const prefix = navigator.language.slice(0, 2).toLowerCase();
    if (SUPPORTED_LOCALES.includes(prefix)) return prefix;
  }
  return DEFAULT_LOCALE;
}

export async function activateLocale(locale) {
  const target = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  i18n.load(target, catalogs[target]);
  i18n.activate(target);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, target);
  }
}

export { i18n };
