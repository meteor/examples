import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(dialog) {
  return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0
  );
}

export function useDialogFocusTrap({ opened, onDismiss, dismissDisabled = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!opened) {
      return undefined;
    }

    const previousFocus = document.activeElement;
    dialogRef.current?.focus();

    return () => previousFocus?.focus?.();
  }, [opened]);

  function onDialogKeyDown(event) {
    if (event.key === 'Escape' && !dismissDisabled) {
      event.preventDefault();
      onDismiss();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const dialog = dialogRef.current;
    const focusableElements = dialog ? getFocusableElements(dialog) : [];
    if (!dialog || focusableElements.length === 0) {
      event.preventDefault();
      dialog?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    const activeElement = document.activeElement;

    if (
      event.shiftKey &&
      (activeElement === dialog || activeElement === firstElement || !dialog.contains(activeElement))
    ) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      (activeElement === lastElement || !dialog.contains(activeElement))
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return { dialogRef, onDialogKeyDown };
}
