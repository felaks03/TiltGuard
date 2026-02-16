// Service Worker para la extensión TiltGuard
const API_URL = "http://localhost:4000/api";

chrome.runtime.onInstalled.addListener(async () => {
  // Crear alarma para polling cada 60 segundos
  chrome.alarms.create("syncBlockingStatus", { periodInMinutes: 1 });
  // Crear alarma para sincronizar estado de guías cada 30 segundos
  chrome.alarms.create("syncGuideAccessStatus", { periodInMinutes: 0.5 });

  // Registrar el ID de la extensión en el backend
  await registerExtensionId();

  // Inicializar reglas de Tradovate según estado actual
  const data = await chrome.storage.sync.get(["setupGuideCompleted"]);
  await updateTradovateRules(data.setupGuideCompleted || false);
});

// Polling: sincronizar estado de bloqueo y guías desde el backend
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "syncBlockingStatus") {
    await syncBlockingStatus();
  } else if (alarm.name === "syncGuideAccessStatus") {
    await syncGuideAccessStatus();
  }
});

// ============================================
// REGISTER EXTENSION ID
// ============================================
async function registerExtensionId() {
  try {
    const result = await chrome.storage.local.get(["tiltguardToken"]);
    const token = result.tiltguardToken;
    if (!token) return;

    const extensionId = chrome.runtime.id;
    await fetch(`${API_URL}/guide-access/register-extension`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ extensionId }),
    });
  } catch {
    // Network error, silently ignore
  }
}

// ============================================
// TRADOVATE REDIRECT/BLOCK RULES
// ============================================
const TRADOVATE_BLOCK_RULE_ID = 1;
const TRADOVATE_REDIRECT_RULE_ID = 2;

async function updateTradovateRules(setupCompleted) {
  try {
    if (setupCompleted) {
      // Activar: bloquear /devices y redirigir tradovate.com → trader.tradovate.com
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [TRADOVATE_BLOCK_RULE_ID, TRADOVATE_REDIRECT_RULE_ID],
        addRules: [
          {
            id: TRADOVATE_BLOCK_RULE_ID,
            priority: 2,
            action: { type: "block" },
            condition: {
              urlFilter: "/devices",
              requestDomains: ["tradovate.com", "www.tradovate.com"],
              resourceTypes: ["main_frame"],
            },
          },
          {
            id: TRADOVATE_REDIRECT_RULE_ID,
            priority: 1,
            action: {
              type: "redirect",
              redirect: { url: "https://trader.tradovate.com" },
            },
            condition: {
              requestDomains: ["tradovate.com", "www.tradovate.com"],
              resourceTypes: ["main_frame"],
            },
          },
        ],
      });
    } else {
      // Desactivar: eliminar todas las reglas
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [TRADOVATE_BLOCK_RULE_ID, TRADOVATE_REDIRECT_RULE_ID],
      });
    }
  } catch {
    // API might not be available
  }
}

// ============================================
// BLOCKING SYNC
// ============================================
async function syncBlockingStatus() {
  try {
    const result = await chrome.storage.local.get(["tiltguardToken"]);
    const token = result.tiltguardToken;
    if (!token) return;

    const response = await fetch(`${API_URL}/blocking/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await chrome.storage.local.remove(["tiltguardToken", "tiltguardEmail"]);
      }
      return;
    }

    const data = await response.json();
    if (!data.success) return;

    const { blockRiskSettings, blockUntil } = data.data;

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

    if (shouldBlock !== currentlyBlocked) {
      await chrome.storage.sync.set({
        blockRiskSettings: shouldBlock,
        blockUntil: blockUntilMs,
      });

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
}

// ============================================
// GUIDE ACCESS SYNC
// ============================================
async function syncGuideAccessStatus() {
  try {
    const result = await chrome.storage.local.get(["tiltguardToken"]);
    const token = result.tiltguardToken;
    if (!token) return;

    const response = await fetch(`${API_URL}/guide-access/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return;

    const data = await response.json();
    if (!data.success) return;

    const { setupCompleted, cooldownUntil, accessUntil } = data.data;

    // Comprobar si el estado de setup cambió para actualizar reglas de Tradovate
    const previous = await chrome.storage.sync.get(["setupGuideCompleted"]);
    const wasCompleted = previous.setupGuideCompleted || false;
    const isCompleted = setupCompleted || false;

    // Sincronizar con chrome.storage.sync para que setup-guide.js lo lea
    await chrome.storage.sync.set({
      setupGuideCompleted: isCompleted,
      cooldownUntil: cooldownUntil ? new Date(cooldownUntil).getTime() : null,
      accessUntil: accessUntil ? new Date(accessUntil).getTime() : null,
    });

    // Actualizar reglas de Tradovate si el estado de setup cambió
    if (wasCompleted !== isCompleted) {
      await updateTradovateRules(isCompleted);
    }

    // Registrar extensionId periódicamente (en caso de que el usuario haya hecho login después de instalar)
    await registerExtensionId();
  } catch {
    // Network error, silently ignore
  }
}
