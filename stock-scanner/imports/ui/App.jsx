import React, { useEffect, useMemo, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Snackbar from '@mui/material/Snackbar';
import { InventoryItems } from '../api/inventory/collection';
import AppShell from './components/AppShell';
import HcpUpdatePrompt from './components/HcpUpdatePrompt';
import ProductSheet from './components/ProductSheet';
import InventoryPage from './pages/InventoryPage';
import SystemInfoPage from './pages/SystemInfoPage';
import { getOwnerId } from './owner';
import { scanBarcode } from './native/barcode';
import { impactLight } from './native/haptics';
import { shareAudit } from './native/share';
import { exitNativeApp, useNativeBackButton } from './native/backButton';
import {
  STOCK_SCANNER_INFO,
  getApplicationInfo,
  getDdpEndpoint,
} from './native/appInfo';
import {
  HCP_PREVIEW_VERSION,
  applyHcpUpdate,
  checkForHcpUpdates,
  listenForHcpUpdates,
} from './native/hcp';

const browserAppInfo = {
  ...STOCK_SCANNER_INFO,
  platform: 'web',
  native: false,
};

export default function App() {
  const ownerId = useMemo(() => getOwnerId(), []);
  const [currentView, setCurrentView] = useState('inventory');
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [busy, setBusy] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [message, setMessage] = useState('');
  const [appInfo, setAppInfo] = useState(browserAppInfo);
  const [ddpEnabled, setDdpEnabled] = useState(true);
  const [hcpMessage, setHcpMessage] = useState('Ready to check for mobile updates.');
  const [checkingHcp, setCheckingHcp] = useState(false);
  const [installingHcp, setInstallingHcp] = useState(false);
  const [hcpUpdateVersion, setHcpUpdateVersion] = useState(null);
  const [hcpPromptOpen, setHcpPromptOpen] = useState(false);

  useNativeBackButton(() => {
    if (hcpPromptOpen) {
      setHcpPromptOpen(false);
    } else if (selectedItemId) {
      setSelectedItemId(null);
    } else if (mobileNavigationOpen) {
      setMobileNavigationOpen(false);
    } else if (currentView !== 'inventory') {
      setCurrentView('inventory');
    } else {
      void exitNativeApp();
    }
  });

  useEffect(() => {
    void getApplicationInfo().then(setAppInfo);
  }, []);

  useEffect(() => (
    listenForHcpUpdates((version) => {
      setHcpUpdateVersion(version);
      setHcpPromptOpen(true);
      setHcpMessage(`Version ${version} downloaded and ready.`);
    })
  ), []);

  const { items, ready, ddpStatus } = useTracker(() => {
    const handle = Meteor.subscribe('inventory.byOwner', ownerId);
    return {
      ready: handle.ready(),
      items: InventoryItems.find({ ownerId }, { sort: { updatedAt: -1 } }).fetch(),
      ddpStatus: Meteor.status().status,
    };
  }, [ownerId]);

  const selectedItem = items.find((item) => item._id === selectedItemId) || null;

  async function addSku(sku) {
    const cleanSku = sku.trim();
    if (!cleanSku) return;

    setBusy(true);
    try {
      await Meteor.callAsync('inventory.scanSku', { ownerId, sku: cleanSku });
      await impactLight();
      setManualSku('');
      setMessage(`Scanned ${cleanSku}`);
    } catch (error) {
      console.warn('Unable to add inventory item', error);
      setMessage('Unable to add item. Check connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBarcodeScan() {
    try {
      const result = await scanBarcode();
      if (result.sku) {
        await addSku(result.sku);
      } else {
        setMessage('Barcode scan cancelled');
      }
    } catch (error) {
      console.warn('Barcode scan failed', error);
      setMessage('Barcode scanner unavailable. Enter the SKU instead.');
    }
  }

  async function handleSaveProduct({ itemId, name, category, minStock }) {
    try {
      await Meteor.callAsync('inventory.updateItem', {
        ownerId,
        itemId,
        name,
        category,
        minStock,
      });
      setSelectedItemId(null);
      setMessage('Product saved');
    } catch (error) {
      console.warn('Unable to save product', error);
      setMessage('Unable to save product. Try again.');
    }
  }

  async function handleAdjust(itemId, delta) {
    try {
      await Meteor.callAsync('inventory.adjustStock', { ownerId, itemId, delta });
      await impactLight();
    } catch (error) {
      console.warn('Unable to adjust stock', error);
      setMessage('Unable to adjust stock. Try again.');
    }
  }

  async function handleShareAudit() {
    const lines = items.map((item) => `${item.name}: ${item.count} on hand (${item.sku})`);
    const result = await shareAudit({
      title: 'Stock audit',
      text: ['Stock audit', `${items.length} items`, ...lines].join('\n'),
    });

    setMessage(
      result.shared
        ? 'Share sheet opened'
        : result.copied
          ? 'Audit summary copied'
          : 'Sharing unavailable'
    );
  }

  async function handleCheckHcpUpdate() {
    setCheckingHcp(true);
    setHcpMessage('Checking for a newer app version...');
    try {
      const result = await checkForHcpUpdates();
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
  }

  async function handleInstallHcpUpdate() {
    setInstallingHcp(true);
    try {
      await applyHcpUpdate();
    } catch (error) {
      console.warn('HCP reload failed', error);
      setInstallingHcp(false);
      setHcpMessage('Install unavailable here.');
    }
  }

  function handleToggleDdp(enabled) {
    setDdpEnabled(enabled);
    if (enabled) {
      Meteor.reconnect();
      setMessage('Live sync resumed');
    } else {
      Meteor.disconnect();
      setMessage('Live sync paused');
    }
  }

  function handleReconnect() {
    setDdpEnabled(true);
    Meteor.reconnect();
    setMessage('Reconnecting live sync');
  }

  const hcp = {
    checking: checkingHcp,
    message: hcpMessage,
    onCheck: handleCheckHcpUpdate,
    onPreview: () => {
      setHcpUpdateVersion(HCP_PREVIEW_VERSION);
      setHcpPromptOpen(true);
      setHcpMessage('Previewing the update prompt.');
    },
  };

  return (
    <>
      <AppShell
        currentView={currentView}
        mobileOpen={mobileNavigationOpen}
        onMobileOpenChange={setMobileNavigationOpen}
        onNavigate={setCurrentView}
        onShare={handleShareAudit}
        shareDisabled={items.length === 0}
      >
        {currentView === 'inventory' ? (
          <InventoryPage
            busy={busy}
            items={items}
            lowStockOnly={lowStockOnly}
            manualSku={manualSku}
            onAddSku={() => addSku(manualSku)}
            onManualSkuChange={setManualSku}
            onScanBarcode={handleBarcodeScan}
            onSelect={setSelectedItemId}
            onToggleLowStock={() => setLowStockOnly((value) => !value)}
            ready={ready}
          />
        ) : (
          <SystemInfoPage
            appInfo={appInfo}
            ddpEnabled={ddpEnabled}
            ddpEndpoint={getDdpEndpoint()}
            ddpStatus={ddpStatus}
            hcp={hcp}
            onReconnect={handleReconnect}
            onToggleDdp={handleToggleDdp}
          />
        )}
      </AppShell>

      <ProductSheet
        item={selectedItem}
        onClose={() => setSelectedItemId(null)}
        onSave={handleSaveProduct}
        onAdjust={handleAdjust}
      />

      <HcpUpdatePrompt
        installing={installingHcp}
        opened={hcpPromptOpen}
        updateVersion={hcpUpdateVersion}
        onDismiss={() => setHcpPromptOpen(false)}
        onInstall={handleInstallHcpUpdate}
        onReview={() => setHcpPromptOpen(true)}
      />

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={4000}
        onClose={() => setMessage('')}
        message={message}
      />
    </>
  );
}
