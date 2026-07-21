import assert from 'assert';
import { listenForHcpUpdates } from '../imports/ui/native/hcp';

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
});
