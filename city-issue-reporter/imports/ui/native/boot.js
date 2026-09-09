import { Capacitor } from '@capacitor/core';

export async function bootNativeRuntime() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await window.WebAppLocalServer?.startupDidComplete?.();
  } catch (error) {
    console.warn('Native startup bridge failed', error);
  }
}
