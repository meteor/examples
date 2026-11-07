import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';

export function useNativeBackButton(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let disposed = false;
    let listener;

    void CapacitorApp.addListener('backButton', () => handlerRef.current())
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          listener = handle;
        }
      })
      .catch((error) => console.warn('Unable to register native Back navigation', error));

    return () => {
      disposed = true;
      if (listener) void listener.remove();
    };
  }, []);
}

export function exitNativeApp() {
  return CapacitorApp.exitApp();
}
