// Función para bloquear el elemento Risk Settings
function blockRiskSettings() {
  const containers = document.querySelectorAll(
    ".MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-2.MuiGrid-item.MuiGrid-grid-xs-12",
  );

  containers.forEach((container) => {
    const button = container.querySelector("button");
    if (button && button.textContent.includes("Risk Settings")) {
      container.style.display = "none";
      container.setAttribute("data-tiltguard-blocked", "true");
      console.log("Risk Settings bloqueado");
    }
  });
}

// Función para desbloquear
function unblockRiskSettings() {
  const blockedElements = document.querySelectorAll(
    "[data-tiltguard-blocked=true]",
  );

  blockedElements.forEach((element) => {
    element.style.display = "";
    element.removeAttribute("data-tiltguard-blocked");
    console.log("Risk Settings desbloqueado");
  });
}

// Aplicar estado al cargar
const applyBlockState = () => {
  chrome.storage.sync.get(["blockRiskSettings"], (result) => {
    const shouldBlock =
      result.blockRiskSettings !== undefined ? result.blockRiskSettings : false;

    if (shouldBlock) {
      blockRiskSettings();
    } else {
      unblockRiskSettings();
    }
  });
};

// Cargar al iniciar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyBlockState);
} else {
  applyBlockState();
}

// Escuchar cambios desde el popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "UPDATE_BLOCK_STATUS") {
    if (request.blockRiskSettings) {
      blockRiskSettings();
    } else {
      unblockRiskSettings();
    }
    sendResponse({ success: true });
  }
});

// Observar cambios en el DOM y reaplicar bloqueo si es necesario
const observer = new MutationObserver(() => {
  chrome.storage.sync.get(["blockRiskSettings"], (result) => {
    const shouldBlock =
      result.blockRiskSettings !== undefined ? result.blockRiskSettings : false;

    if (shouldBlock) {
      const alreadyBlocked = document.querySelector(
        "[data-tiltguard-blocked=true]",
      );
      if (!alreadyBlocked) {
        blockRiskSettings();
      }
    }
  });
});

// Iniciar observación
const startObserver = () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserver);
} else {
  startObserver();
}
