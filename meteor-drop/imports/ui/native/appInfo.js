import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const METEOR_DROP_INFO = {
  appId: 'com.meteor.examples.meteordrop',
  name: 'Meteor Drop',
  version: '1.0.0',
  build: '1',
};

export async function getApplicationInfo() {
  const fallback = {
    ...METEOR_DROP_INFO,
    platform: Capacitor.getPlatform(),
    native: Capacitor.isNativePlatform(),
  };

  if (!fallback.native) {
    return fallback;
  }

  try {
    const info = await App.getInfo();
    return {
      ...fallback,
      appId: info.id || fallback.appId,
      name: info.name || fallback.name,
      version: info.version || fallback.version,
      build: info.build || fallback.build,
    };
  } catch (error) {
    console.warn('Unable to read native application information', error);
    return fallback;
  }
}

export function getDdpEndpoint() {
  const runtimeConfig = globalThis.__meteor_runtime_config__ || {};
  return (
    runtimeConfig.DDP_DEFAULT_CONNECTION_URL ||
    runtimeConfig.ROOT_URL ||
    globalThis.location?.origin ||
    'Not configured'
  );
}
