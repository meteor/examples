import assert from 'assert';
import { readBrowserNetworkStatus } from '../imports/ui/native/network';

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
});
