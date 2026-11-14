import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import { Capacitor } from '@capacitor/core';

export async function scanBarcode({
  capacitor = Capacitor,
  scanner = CapacitorBarcodeScanner,
} = {}) {
  if (!capacitor.isNativePlatform()) {
    return { sku: null, source: 'manual', cancelled: true };
  }

  const result = await scanner.scanBarcode({
    hint: CapacitorBarcodeScannerTypeHint.ALL,
    scanInstructions: 'Align barcode inside frame',
    scanButton: true,
    scanText: 'Use barcode',
    cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
    scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
  });

  return {
    sku: result.ScanResult || null,
    source: 'barcode',
    cancelled: !result.ScanResult,
  };
}
