import assert from 'assert';
import { listenForHcpUpdates } from '../imports/ui/native/hcp';
import * as hcpModule from '../imports/ui/native/hcp';

describe('HCP bridge', function () {
  it('stops update callbacks and removes native listener handles on cleanup', function () {
    const versions = [];
    let nativeCallback;
    let removed = false;
    const bridge = {
      onNewVersionReady(callback) {
        nativeCallback = callback;
        return {
          remove() {
            removed = true;
          },
        };
      },
    };
    const cleanup = listenForHcpUpdates((version) => versions.push(version), bridge);

    nativeCallback('1.1.0');
    cleanup();
    nativeCallback('1.2.0');

    assert.deepStrictEqual(versions, ['1.1.0']);
    assert.strictEqual(removed, true);
  });

  it('reuses a void-returning native listener across component remounts', function () {
    const versions = [];
    let nativeCallback;
    let listenerCount = 0;
    const bridge = {
      onNewVersionReady(callback) {
        listenerCount += 1;
        nativeCallback = callback;
      },
    };

    const firstCleanup = listenForHcpUpdates((version) => versions.push(`first:${version}`), bridge);
    firstCleanup();
    const secondCleanup = listenForHcpUpdates((version) => versions.push(`second:${version}`), bridge);

    nativeCallback('1.2.0');
    secondCleanup();
    nativeCallback('1.3.0');

    assert.strictEqual(listenerCount, 1);
    assert.deepStrictEqual(versions, ['second:1.2.0']);
  });

  it('holds a ready HCP bundle until install is approved', async function () {
    assert.strictEqual(typeof hcpModule.createHcpReloadConsent, 'function');

    let migrate;
    let retryCalls = 0;
    let switchCalls = 0;
    let browserReloadCalls = 0;
    let nativeCallback;
    const consent = hcpModule.createHcpReloadConsent();
    const bridge = {
      onNewVersionReady(callback) {
        nativeCallback = callback;
      },
      switchToPendingVersion(resolve) {
        switchCalls += 1;
        resolve();
      },
    };

    consent.install({
      _onMigrate(name, callback) {
        assert.strictEqual(name, 'native-hcp-consent');
        migrate = callback;
      },
    });
    hcpModule.listenForHcpUpdates(() => {}, bridge, consent);
    nativeCallback('1.2.0');

    assert.strictEqual(migrate(() => {
      retryCalls += 1;
    }), false);

    await hcpModule.applyHcpUpdate(
      bridge,
      () => {
        browserReloadCalls += 1;
      },
      consent
    );

    assert.strictEqual(retryCalls, 0);
    assert.strictEqual(switchCalls, 1);
    assert.strictEqual(browserReloadCalls, 0);
    assert.deepStrictEqual(migrate(() => {}), [true]);
  });

  it('replays an HCP event received before the dialog listener mounts', function () {
    let nativeCallback;
    const versions = [];
    const bridge = {
      onNewVersionReady(callback) {
        nativeCallback = callback;
      },
    };

    listenForHcpUpdates(() => {}, bridge);
    nativeCallback('1.3.0');
    listenForHcpUpdates((version) => versions.push(version), bridge);

    assert.deepStrictEqual(versions, ['1.3.0']);
  });

  it('detects a downloaded native update when the bridge event is missed', async function () {
    let checks = 0;
    const bridge = {
      checkForUpdates(resolve) {
        resolve();
      },
    };
    const plugin = {
      async isUpdateAvailable() {
        checks += 1;
        return { available: checks >= 2 };
      },
    };

    const result = await hcpModule.checkForHcpUpdates(
      bridge,
      plugin,
      () => Promise.resolve()
    );

    assert.deepStrictEqual(result, { checked: true, updateReady: true });
    assert.strictEqual(checks, 2);
  });
});
