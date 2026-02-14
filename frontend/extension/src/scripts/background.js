// Service Worker para la extensión TiltGuard
const API_URL = "http://localhost:4000/api";

chrome.runtime.onInstalled.addListener(() => {
  // Crear alarma para polling cada 60 segundos
  chrome.alarms.create("syncBlockingStatus", { periodInMinutes: 1 });
});

// Polling: sincronizar estado de bloqueo desde el backend
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "syncBlockingStatus") return;

  try {
    const result = await chrome.storage.local.get(["tiltguardToken"]);
    const token = result.tiltguardToken;
    if (!token) return;

    const response = await fetch(`${API_URL}/blocking/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token inválido — limpiar
        await chrome.storage.local.remove(["tiltguardToken", "tiltguardEmail"]);
      }
      return;
    }

    const data = await response.json();
    if (!data.success) return;

    const { blockRiskSettings, blockUntil } = data.data;

    // Obtener estado actual de chrome.storage
    const current = await chrome.storage.sync.get([
      "blockRiskSettings",
      "blockUntil",
    ]);

    let shouldBlock = false;
    let blockUntilMs = null;

    if (blockRiskSettings && blockUntil) {
      const until = new Date(blockUntil).getTime();
      if (Date.now() < until) {
        shouldBlock = true;
        blockUntilMs = until;
      }
    }

    const currentlyBlocked = current.blockRiskSettings || false;

    // Si el estado cambió, actualizar chrome.storage y notificar content scripts
    if (shouldBlock !== currentlyBlocked) {
      await chrome.storage.sync.set({
        blockRiskSettings: shouldBlock,
        blockUntil: blockUntilMs,
      });

      // Notificar todas las pestañas de Tradovate
      const tabs = await chrome.tabs.query({
        url: "*://trader.tradovate.com/*",
      });
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: "UPDATE_BLOCK_STATUS",
            blockRiskSettings: shouldBlock,
          });
          if (shouldBlock) {
            chrome.tabs.reload(tab.id);
          }
        } catch {
          // Tab might not have content script
        }
      }
    }
  } catch {
    // Network error, silently ignore
  }
});
