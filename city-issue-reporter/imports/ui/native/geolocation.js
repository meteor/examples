import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

function fromPosition(position, source) {
  return {
    latitude: Number(position.coords.latitude.toFixed(4)),
    longitude: Number(position.coords.longitude.toFixed(4)),
    accuracy: Math.round(position.coords.accuracy || 0),
    source,
  };
}

export async function getCurrentLocation() {
  if (Capacitor.isNativePlatform()) {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return fromPosition(position, 'native');
  }

  if (!navigator.geolocation) {
    return { latitude: 0, longitude: 0, accuracy: 0, source: 'unsupported' };
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });

  return fromPosition(position, 'browser');
}
