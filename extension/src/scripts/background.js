// Service Worker para la extensión
console.log("TiltGuard background service worker loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("TiltGuard extensión instalada");
});
