import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export async function capturePhoto({ capacitor = Capacitor, camera = Camera } = {}) {
  if (!capacitor.isNativePlatform()) {
    return { dataUrl: null, source: 'file-input' };
  }

  const photo = await camera.getPhoto({
    quality: 70,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
  });

  return {
    dataUrl: photo.dataUrl || null,
    source: 'camera',
  };
}
