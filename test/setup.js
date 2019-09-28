// Prevent the browser polyfill to throw an error when loaded outside of a WebExtension
window.chrome.runtime.id = 'unit-tests';
