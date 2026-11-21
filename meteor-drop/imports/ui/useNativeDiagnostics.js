import { useCallback, useEffect, useMemo, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Capacitor } from '@capacitor/core';
import { METEOR_DROP_INFO, getApplicationInfo, getDdpEndpoint } from './native/appInfo';
import {
  HCP_PREVIEW_VERSION,
  applyHcpUpdate,
  checkForHcpUpdates,
  listenForHcpUpdates,
} from './native/hcp';
import { getNetworkStatus, listenNetworkStatus } from './native/network';

const browserAppInfo = {
  ...METEOR_DROP_INFO,
  platform: 'web',
  native: false,
};

export function useNativeDiagnostics() {
  const [dark, setDark] = useState(false);
  const [ddpEnabled, setDdpEnabled] = useState(true);
  const [appInfo, setAppInfo] = useState(browserAppInfo);
  const [networkStatus, setNetworkStatus] = useState({
    connected: true,
    connectionType: 'wifi',
  });
  const [checkingHcp, setCheckingHcp] = useState(false);
  const [installingHcp, setInstallingHcp] = useState(false);
  const [hcpMessage, setHcpMessage] = useState('Ready to check for app updates.');
  const [hcpUpdateVersion, setHcpUpdateVersion] = useState(null);
  const [hcpPromptOpen, setHcpPromptOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => setDark(mediaQuery.matches);

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  useEffect(() => {
    void getApplicationInfo().then(setAppInfo);
    void getNetworkStatus().then(setNetworkStatus).catch(() => {});
    return listenNetworkStatus(setNetworkStatus);
  }, []);

  useEffect(
    () =>
      listenForHcpUpdates((version) => {
        setHcpUpdateVersion(version);
        setHcpPromptOpen(true);
        setHcpMessage(`Version ${version} downloaded and ready.`);
      }),
    []
  );

  const handleCheckHcpUpdate = useCallback(async () => {
    setCheckingHcp(true);
    setHcpMessage('Checking for a newer app version...');

    try {
      const result = await checkForHcpUpdates();
      if (result.updateReady) {
        setHcpUpdateVersion('downloaded');
        setHcpPromptOpen(true);
        setHcpMessage('Update downloaded and ready.');
        return;
      }
      setHcpMessage(
        result.checked
          ? 'You will be prompted here when a new version is ready.'
          : 'Updates can be checked from mobile builds.'
      );
    } catch (error) {
      console.warn('HCP check failed', error);
      setHcpMessage('Unable to check for updates. Try again.');
    } finally {
      setCheckingHcp(false);
    }
  }, []);

  const handleInstallHcpUpdate = useCallback(async () => {
    setInstallingHcp(true);

    try {
      await applyHcpUpdate();
    } catch (error) {
      console.warn('HCP reload failed', error);
      setInstallingHcp(false);
      setHcpMessage('Install unavailable here.');
    }
  }, []);

  const handleToggleDdp = useCallback((enabled) => {
    setDdpEnabled(enabled);
    if (enabled) {
      Meteor.reconnect();
      return;
    }
    Meteor.disconnect();
  }, []);

  const handleReconnect = useCallback(() => {
    setDdpEnabled(true);
    Meteor.reconnect();
  }, []);

  const hcp = useMemo(
    () => ({
      checking: checkingHcp,
      installing: installingHcp,
      message: hcpMessage,
      opened: hcpPromptOpen,
      updateVersion: hcpUpdateVersion,
      onCheck: handleCheckHcpUpdate,
      onPreview: () => {
        setHcpUpdateVersion(HCP_PREVIEW_VERSION);
        setHcpPromptOpen(true);
        setHcpMessage('Previewing the update prompt.');
      },
      onInstall: handleInstallHcpUpdate,
      onDismiss: () => setHcpPromptOpen(false),
      onReview: () => setHcpPromptOpen(true),
    }),
    [
      checkingHcp,
      handleCheckHcpUpdate,
      handleInstallHcpUpdate,
      hcpMessage,
      hcpPromptOpen,
      hcpUpdateVersion,
      installingHcp,
    ]
  );

  return {
    appInfo,
    dark,
    ddpEnabled,
    ddpEndpoint: getDdpEndpoint(),
    hcp,
    hcpUpdateVersion,
    networkStatus,
    onReconnect: handleReconnect,
    onToggleDdp: handleToggleDdp,
    theme: Capacitor.getPlatform() === 'ios' ? 'ios' : 'material',
  };
}
