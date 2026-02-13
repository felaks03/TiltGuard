document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3000/api";

  // Screens
  const authScreen = document.getElementById("authScreen");
  const mainScreen = document.getElementById("mainScreen");

  // Auth elements
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const authLoginBtn = document.getElementById("authLoginBtn");
  const authError = document.getElementById("authError");
  const registerLink = document.getElementById("registerLink");

  // Main screen elements
  const authUserEmail = document.getElementById("authUserEmail");
  const authLogoutBtn = document.getElementById("authLogoutBtn");
  const toggleBtn = document.getElementById("toggleBlockBtn");
  const statusElement = document.getElementById("status");
  const countdownElement = document.getElementById("countdown");
  const durationSelect = document.getElementById("blockDuration");
  const link1 = document.getElementById("link1");
  const advancedSetupBtn = document.getElementById("advancedSetupBtn");
  const helpBtn = document.getElementById("helpBtn");

  // Modal elements
  const confirmationModal = document.getElementById("confirmationModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  let pendingAction = null;
  let countdownInterval = null;

  // ==========================================
  // Auth helpers
  // ==========================================
  function showAuthError(msg) {
    authError.textContent = msg;
    authError.style.display = "block";
  }

  function hideAuthError() {
    authError.style.display = "none";
  }

  async function getToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["tiltguardToken", "tiltguardEmail"], (r) => {
        resolve({
          token: r.tiltguardToken || null,
          email: r.tiltguardEmail || null,
        });
      });
    });
  }

  async function saveToken(token, email) {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { tiltguardToken: token, tiltguardEmail: email },
        resolve,
      );
    });
  }

  async function clearToken() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(
        ["tiltguardToken", "tiltguardEmail"],
        resolve,
      );
    });
  }

  async function apiCall(endpoint, options = {}) {
    const { token } = await getToken();
    if (!token) return null;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) },
      });
      if (response.status === 401) {
        await clearToken();
        showScreen("auth");
        return null;
      }
      return await response.json();
    } catch {
      return null;
    }
  }

  // ==========================================
  // Screen management
  // ==========================================
  function showScreen(screen) {
    if (screen === "auth") {
      authScreen.style.display = "block";
      mainScreen.style.display = "none";
    } else {
      authScreen.style.display = "none";
      mainScreen.style.display = "block";
    }
  }

  async function initUI() {
    const { token, email } = await getToken();
    if (token && email) {
      authUserEmail.textContent = `✓ ${email}`;
      showScreen("main");
      loadStatus();
    } else {
      showScreen("auth");
    }
  }

  // ==========================================
  // Login
  // ==========================================
  authLoginBtn.addEventListener("click", async () => {
    hideAuthError();
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if (!email || !password) {
      showAuthError("Introduce email y contraseña");
      return;
    }
    authLoginBtn.disabled = true;
    authLoginBtn.textContent = "Conectando...";

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        await saveToken(data.token, email);
        authUserEmail.textContent = `✓ ${email}`;
        showScreen("main");
        loadStatus();
      } else {
        showAuthError(data.error || "Credenciales incorrectas");
      }
    } catch {
      showAuthError("No se pudo conectar al servidor");
    }
    authLoginBtn.disabled = false;
    authLoginBtn.textContent = "Iniciar Sesión";
  });

  // Enter key submits login
  authPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") authLoginBtn.click();
  });

  // Register link → open web /register
  registerLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "http://localhost:4200/register" });
  });

  // Logout
  authLogoutBtn.addEventListener("click", async () => {
    await clearToken();
    authEmail.value = "";
    authPassword.value = "";
    hideAuthError();
    showScreen("auth");
  });

  // ==========================================
  // Modal functions
  // ==========================================
  function showConfirmationModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmationModal.classList.add("active");
    pendingAction = onConfirm;
  }

  function closeConfirmationModal() {
    confirmationModal.classList.remove("active");
    pendingAction = null;
  }

  // ==========================================
  // Navigation
  // ==========================================
  advancedSetupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const guideUrl = chrome.runtime.getURL("src/pages/setup-guide.html");
    chrome.tabs.create({ url: guideUrl });
  });

  helpBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const settingsGuideUrl = chrome.runtime.getURL(
      "src/pages/settings-guide.html",
    );
    chrome.tabs.create({ url: settingsGuideUrl });
  });

  link1.addEventListener("click", () => {
    chrome.tabs.update({ url: "https://trader.tradovate.com" });
  });

  // ==========================================
  // Duration select
  // ==========================================
  durationSelect.addEventListener("change", () => {
    toggleBtn.disabled = !durationSelect.value;
  });

  // ==========================================
  // Load status - backend first, chrome.storage fallback
  // ==========================================
  async function loadStatusFromBackend() {
    const result = await apiCall("/blocking/status");
    if (result && result.success) {
      const { blockRiskSettings, blockUntil } = result.data;
      if (blockRiskSettings && blockUntil) {
        const until = new Date(blockUntil).getTime();
        const now = Date.now();
        if (now < until) {
          chrome.storage.sync.set({
            blockRiskSettings: true,
            blockUntil: until,
          });
          updateBlockUI(true, until);
          durationSelect.disabled = true;
          toggleBtn.disabled = true;
          startCountdown(until);
          return true;
        }
      }
      chrome.storage.sync.set({ blockRiskSettings: false, blockUntil: null });
      updateBlockUI(false);
      durationSelect.disabled = false;
      return true;
    }
    return false;
  }

  async function loadStatus() {
    const { token } = await getToken();
    if (token) {
      const loaded = await loadStatusFromBackend();
      if (loaded) return;
    }

    // Fallback: chrome.storage.sync
    chrome.storage.sync.get(["blockRiskSettings", "blockUntil"], (result) => {
      const isBlocked = result.blockRiskSettings || false;
      const blockUntil = result.blockUntil;

      if (blockUntil) {
        const now = Date.now();
        if (now < blockUntil) {
          updateBlockUI(true, blockUntil);
          durationSelect.disabled = true;
          toggleBtn.disabled = true;
          startCountdown(blockUntil);
        } else {
          chrome.storage.sync.set({
            blockRiskSettings: false,
            blockUntil: null,
          });
          updateBlockUI(false);
          durationSelect.disabled = false;
        }
      } else {
        updateBlockUI(isBlocked);
        durationSelect.disabled = false;
      }
    });
  }

  // ==========================================
  // Activate blocking
  // ==========================================
  toggleBtn.addEventListener("click", async () => {
    const duration = durationSelect.value;
    if (!duration) return;

    showConfirmationModal(
      "¿Bloquear Risk Settings?",
      `Esto bloqueará Risk Settings por ${duration === "day" ? "1 día" : duration === "week" ? "1 semana" : "1 mes"}. ¿Deseas continuar?`,
      async () => {
        try {
          let blockUntil;

          const { token } = await getToken();
          if (token) {
            const result = await apiCall("/blocking/activate", {
              method: "POST",
              body: JSON.stringify({ duration }),
            });
            if (result && result.success) {
              blockUntil = new Date(result.data.blockUntil).getTime();
            }
          }

          if (!blockUntil) {
            blockUntil = await calculateBlockUntil(duration);
          }

          chrome.storage.sync.set(
            { blockRiskSettings: true, blockUntil: blockUntil },
            () => {
              chrome.tabs.query(
                { url: "*://trader.tradovate.com/*" },
                (tabs) => {
                  tabs.forEach((tab) => {
                    chrome.tabs
                      .sendMessage(tab.id, {
                        type: "UPDATE_BLOCK_STATUS",
                        blockRiskSettings: true,
                      })
                      .catch(() => {});
                    chrome.tabs.reload(tab.id);
                  });
                },
              );

              updateBlockUI(true, blockUntil);
              durationSelect.disabled = true;
              toggleBtn.disabled = true;
              startCountdown(blockUntil);
            },
          );
          closeConfirmationModal();
        } catch (error) {
          alert("Error al activar el bloqueo");
          closeConfirmationModal();
        }
      },
    );
  });

  // ==========================================
  // Modal buttons
  // ==========================================
  modalCancelBtn.addEventListener("click", closeConfirmationModal);

  modalConfirmBtn.addEventListener("click", () => {
    if (pendingAction) {
      pendingAction();
    }
  });

  confirmationModal.addEventListener("click", (e) => {
    if (e.target === confirmationModal) {
      closeConfirmationModal();
    }
  });

  // ==========================================
  // Time calculation (fallback when backend unavailable)
  // ==========================================
  async function calculateBlockUntil(duration) {
    try {
      const response = await fetch(
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
      );
      const data = await response.json();
      const nowDate = new Date(data.datetime);
      let blockUntilDate = new Date(nowDate);

      if (duration === "day") {
        blockUntilDate.setHours(23, 59, 59, 999);
      } else if (duration === "week") {
        const dayOfWeek = blockUntilDate.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
        blockUntilDate.setDate(blockUntilDate.getDate() + daysUntilSunday);
        blockUntilDate.setHours(23, 59, 59, 999);
      } else if (duration === "month") {
        blockUntilDate = new Date(
          blockUntilDate.getFullYear(),
          blockUntilDate.getMonth() + 1,
          0,
        );
        blockUntilDate.setHours(23, 59, 59, 999);
      }

      return blockUntilDate.getTime();
    } catch {
      const nowDate = new Date();
      let blockUntilDate = new Date(nowDate);

      if (duration === "day") {
        blockUntilDate.setHours(23, 59, 59, 999);
      } else if (duration === "week") {
        const dayOfWeek = blockUntilDate.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
        blockUntilDate.setDate(blockUntilDate.getDate() + daysUntilSunday);
        blockUntilDate.setHours(23, 59, 59, 999);
      } else if (duration === "month") {
        blockUntilDate = new Date(
          blockUntilDate.getFullYear(),
          blockUntilDate.getMonth() + 1,
          0,
        );
        blockUntilDate.setHours(23, 59, 59, 999);
      }

      return blockUntilDate.getTime();
    }
  }

  // ==========================================
  // Countdown
  // ==========================================
  function startCountdown(blockUntil) {
    if (countdownInterval) clearInterval(countdownInterval);

    function updateCountdown() {
      const now = Date.now();
      const remaining = blockUntil - now;

      if (remaining <= 0) {
        countdownElement.textContent = "Bloqueo expirado";
        chrome.storage.sync.set({ blockRiskSettings: false, blockUntil: null });
        resetUI();
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      countdownElement.textContent = `Bloqueado por: ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  // ==========================================
  // UI helpers
  // ==========================================
  function updateBlockUI(isBlocked, blockUntil = null) {
    if (isBlocked) {
      toggleBtn.textContent = "Bloqueado";
      toggleBtn.classList.add("disabled");
      statusElement.textContent = "Estado: Bloqueado ✓";
    } else {
      toggleBtn.textContent = "Bloquear Risk Settings";
      toggleBtn.classList.remove("disabled");
      statusElement.textContent = "Estado: Desbloqueado ✗";
      countdownElement.textContent = "";
    }
  }

  function resetUI() {
    if (countdownInterval) clearInterval(countdownInterval);
    updateBlockUI(false);
    durationSelect.value = "";
    durationSelect.disabled = false;
    toggleBtn.disabled = true;
    countdownElement.textContent = "";
  }

  // Init
  initUI();
});
