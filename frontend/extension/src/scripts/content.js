const API_URL = "http://localhost:3000/api";

// ==========================================
// Block/Unblock DOM functions
// ==========================================
function blockRiskSettings() {
  const containers = document.querySelectorAll(
    ".MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-2.MuiGrid-item.MuiGrid-grid-xs-12",
  );

  containers.forEach((container) => {
    const button = container.querySelector("button");
    if (button && button.textContent.includes("Risk Settings")) {
      container.style.display = "none";
      container.setAttribute("data-tiltguard-blocked", "true");
    }
  });
}

function unblockRiskSettings() {
  const blockedElements = document.querySelectorAll(
    "[data-tiltguard-blocked=true]",
  );

  blockedElements.forEach((element) => {
    element.style.display = "";
    element.removeAttribute("data-tiltguard-blocked");
  });
}

// ==========================================
// Backend sync helper
// ==========================================
async function checkBackendStatus() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(["tiltguardToken"], (r) => resolve(r));
    });

    const token = result.tiltguardToken;
    if (!token) return null;

    const response = await fetch(`${API_URL}/blocking/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.success) {
      const { blockRiskSettings, blockUntil } = data.data;
      if (blockRiskSettings && blockUntil) {
        const until = new Date(blockUntil).getTime();
        if (Date.now() < until) {
          // Sync to chrome.storage
          chrome.storage.sync.set({
            blockRiskSettings: true,
            blockUntil: until,
          });
          return true;
        }
      }
      return false;
    }
    return null;
  } catch {
    return null;
  }
}

// ==========================================
// Apply block state (checks backend + chrome.storage)
// ==========================================
const applyBlockState = async () => {
  // Try backend first
  const backendStatus = await checkBackendStatus();
  if (backendStatus === true) {
    blockRiskSettings();
    return;
  } else if (backendStatus === false) {
    unblockRiskSettings();
    return;
  }

  // Fallback to chrome.storage
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

// ==========================================
// Initialize
// ==========================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyBlockState);
} else {
  applyBlockState();
}

// Listen for messages from popup / background
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

// ==========================================
// MutationObserver - reapply blocking on DOM changes
// ==========================================
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
