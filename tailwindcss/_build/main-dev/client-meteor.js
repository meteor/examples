/* Polyfill globalThis.module, exports & module for legacy */
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.module === 'undefined') {
    globalThis.module = { exports: {} };
  }
  if (typeof globalThis.exports === 'undefined') {
    globalThis.exports = globalThis.module.exports;
  }
}
if (typeof window.module === 'undefined') {
  window.module = { exports: {} };
}
