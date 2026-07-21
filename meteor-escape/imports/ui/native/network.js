import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export function readBrowserNetworkStatus(navigatorLike = globalThis.navigator) {
  const connected = navigatorLike?.onLine !== false;
  return {
    connected,
    connectionType: connected ? 'wifi' : 'none',
  };
}

export async function getNetworkStatus() {
  if (Capacitor.isNativePlatform()) {
    return Network.getStatus();
  }

  return readBrowserNetworkStatus();
}

export function listenNetworkStatus(callback) {
  if (Capacitor.isNativePlatform()) {
    let handle;
    Network.addListener('networkStatusChange', callback).then((listener) => {
      handle = listener;
    });
    return () => handle?.remove?.();
  }

  const update = () => callback(readBrowserNetworkStatus());
  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
