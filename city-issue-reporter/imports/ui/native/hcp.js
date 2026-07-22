export const HCP_PREVIEW_VERSION = 'demo-preview';

const listenerRegistries = new WeakMap();

function createListenerRegistry(bridge) {
  const registry = {
    listeners: new Set(),
    nativeHandle: undefined,
  };

  registry.nativeHandle = bridge.onNewVersionReady((version) => {
    for (const listener of registry.listeners) {
      listener(version || 'available');
    }
  });
  listenerRegistries.set(bridge, registry);
  return registry;
}

function removeNativeListener(registry) {
  if (typeof registry.nativeHandle === 'function') {
    registry.nativeHandle();
    return true;
  }

  if (typeof registry.nativeHandle?.remove === 'function') {
    void registry.nativeHandle.remove();
    return true;
  }

  return false;
}

export function listenForHcpUpdates(
  onUpdateAvailable,
  bridge = globalThis.window?.WebAppLocalServer
) {
  if (!bridge?.onNewVersionReady) {
    return () => {};
  }

  let registry;

  try {
    registry = listenerRegistries.get(bridge) ?? createListenerRegistry(bridge);
    registry.listeners.add(onUpdateAvailable);
  } catch (error) {
    console.warn('HCP update listener unavailable', error);
    return () => {};
  }

  return () => {
    registry.listeners.delete(onUpdateAvailable);

    if (registry.listeners.size === 0 && removeNativeListener(registry)) {
      listenerRegistries.delete(bridge);
    }
  };
}

export async function checkForHcpUpdates() {
  const bridge = window.WebAppLocalServer;
  if (!bridge?.checkForUpdates) {
    return { checked: false };
  }

  try {
    await new Promise((resolve) => {
      bridge.checkForUpdates(resolve);
    });
    return { checked: true };
  } catch (error) {
    console.warn('HCP update check failed', error);
    return { checked: false, error };
  }
}

export async function applyHcpUpdate() {
  const bridge = window.WebAppLocalServer;
  if (!bridge?.switchToPendingVersion) {
    window.location.reload();
    return;
  }

  await new Promise((resolve, reject) => {
    bridge.switchToPendingVersion(resolve, reject);
  });
}
