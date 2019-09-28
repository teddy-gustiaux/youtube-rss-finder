// Prevent the browser polyfill to throw an error when loaded outside of a WebExtension
window.chrome.runtime.id = 'unit-tests';
// Use the browser polyfill to act as Firefox as well
const browser = chrome;
