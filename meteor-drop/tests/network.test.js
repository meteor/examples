import assert from 'assert';
import {
  getNetworkStatus,
  listenNetworkStatus,
  readBrowserNetworkStatus,
} from '../imports/ui/native/network';

describe('network bridge', function () {
  it('maps browser online state to a connected network snapshot', function () {
    assert.deepStrictEqual(readBrowserNetworkStatus({ onLine: true }), {
      connected: true,
      connectionType: 'wifi',
    });
  });

  it('maps browser offline state to a disconnected network snapshot', function () {
    assert.deepStrictEqual(readBrowserNetworkStatus({ onLine: false }), {
      connected: false,
      connectionType: 'none',
    });
  });

  it('falls back to browser status when native getStatus fails', async function () {
    const result = await getNetworkStatus({
      capacitor: { isNativePlatform: () => true },
      network: {
        getStatus: async () => {
          throw new Error('native failure');
        },
      },
      navigatorLike: { onLine: false },
    });

    assert.deepStrictEqual(result, {
      connected: false,
      connectionType: 'none',
    });
  });

  it('falls back to browser listeners when native addListener rejects', async function () {
    const handlers = new Map();
    const windowLike = {
      addEventListener(type, handler) {
        handlers.set(type, handler);
      },
      removeEventListener(type) {
        handlers.delete(type);
      },
    };
    const events = [];

    const cleanup = listenNetworkStatus((status) => events.push(status), {
      capacitor: { isNativePlatform: () => true },
      network: {
        addListener: async () => {
          throw new Error('listener failure');
        },
      },
      navigatorLike: { onLine: true },
      windowLike,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.strictEqual(typeof handlers.get('online'), 'function');
    assert.strictEqual(typeof handlers.get('offline'), 'function');

    handlers.get('offline')();

    assert.deepStrictEqual(events.at(-1), {
      connected: true,
      connectionType: 'wifi',
    });

    cleanup();
    assert.strictEqual(handlers.size, 0);
  });

  it('removes late native listener handles after unmount without leaking browser listeners', async function () {
    let resolveHandle;
    let removeCalls = 0;
    const handlers = new Map();
    const windowLike = {
      addEventListener(type, handler) {
        handlers.set(type, handler);
      },
      removeEventListener(type) {
        handlers.delete(type);
      },
    };

    const cleanup = listenNetworkStatus(() => {}, {
      capacitor: { isNativePlatform: () => true },
      network: {
        addListener: () =>
          new Promise((resolve) => {
            resolveHandle = resolve;
          }),
      },
      navigatorLike: { onLine: true },
      windowLike,
    });

    cleanup();
    resolveHandle({
      remove() {
        removeCalls += 1;
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.strictEqual(removeCalls, 1);
    assert.strictEqual(handlers.size, 0);
  });
});
