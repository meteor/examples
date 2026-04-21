import { i18n } from '@lingui/core';

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
  // @lingui/loader compiles the JSON catalog at bundle time. No precompile step required.
  const { messages } = await import(`@lingui/loader!../locales/${target}/messages.json`);
  i18n.load(target, messages);
  i18n.activate(target);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, target);
  }
}

export { i18n };
