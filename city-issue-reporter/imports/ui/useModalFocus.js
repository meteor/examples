import { useEffect } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container) {
  return [...container.querySelectorAll(focusableSelector)].filter(
    (element) => element.getAttribute('aria-hidden') !== 'true' && element.offsetParent !== null
  );
}

export default function useModalFocus(active, containerSelector) {
  useEffect(() => {
    if (!active) return undefined;

    const container = document.querySelector(containerSelector);
    const mainView = document.querySelector('.main-view');
    const previousFocus = document.activeElement;
    const mainWasInert = mainView?.hasAttribute('inert') || false;

    if (!container) return undefined;
    if (mainView) mainView.setAttribute('inert', '');

    const focusFrame = requestAnimationFrame(() => {
      getFocusableElements(container)[0]?.focus();
    });

    function trapFocus(event) {
      if (event.key !== 'Tab') return;

      const elements = getFocusableElements(container);
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!container.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', trapFocus);

    return () => {
      cancelAnimationFrame(focusFrame);
      container.removeEventListener('keydown', trapFocus);
      if (mainView && !mainWasInert) mainView.removeAttribute('inert');
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [active, containerSelector]);
}
