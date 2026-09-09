import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export function readBrowserNetworkStatus(navigatorLike = globalThis.navigator) {
  const connected = navigatorLike?.onLine !== false;
  return {
    connected,
    connectionType: connected ? 'wifi' : 'none',
  };
}

function installBrowserNetworkListeners(callback, windowLike, navigatorLike) {
  const update = () => callback(readBrowserNetworkStatus(navigatorLike));
  windowLike.addEventListener('online', update);
  windowLike.addEventListener('offline', update);

  return () => {
    windowLike.removeEventListener('online', update);
    windowLike.removeEventListener('offline', update);
  };
}

export async function getNetworkStatus({
  capacitor = Capacitor,
  network = Network,
  navigatorLike = globalThis.navigator,
} = {}) {
  if (capacitor.isNativePlatform()) {
    try {
      return await network.getStatus();
    } catch (error) {
      console.warn('Unable to read native network status', error);
      return readBrowserNetworkStatus(navigatorLike);
    }
  }

  return readBrowserNetworkStatus(navigatorLike);
}

export function listenNetworkStatus(
  callback,
  {
    capacitor = Capacitor,
    network = Network,
    navigatorLike = globalThis.navigator,
    windowLike = globalThis.window,
  } = {}
) {
  let disposed = false;
  let nativeHandle;
  let browserCleanup;

  const installFallback = () => {
    if (browserCleanup) {
      return;
    }

    browserCleanup = installBrowserNetworkListeners(callback, windowLike, navigatorLike);
  };

  if (capacitor.isNativePlatform()) {
    network
      .addListener('networkStatusChange', callback)
      .then((listener) => {
        if (disposed) {
          void listener.remove?.();
          return;
        }

        nativeHandle = listener;
      })
      .catch((error) => {
        console.warn('Unable to subscribe to native network status', error);
        if (!disposed) {
          installFallback();
        }
      });

    return () => {
      disposed = true;
      browserCleanup?.();
      if (nativeHandle) {
        void nativeHandle.remove?.();
      }
    };
  }

  installFallback();

  return () => {
    disposed = true;
    browserCleanup?.();
  };
}
