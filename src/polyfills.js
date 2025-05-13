// Polyfill for 'global' object
if (typeof global === 'undefined') {
  window.global = window;
} 