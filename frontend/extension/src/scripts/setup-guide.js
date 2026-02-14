document.addEventListener("DOMContentLoaded", () => {
  // Verificar que chrome.runtime esté disponible
  if (!chrome || !chrome.runtime) {
    initializeGuide();
    return;
  }

  // Cargar estado desde la API del backend (sincronizado)
  loadGuideStatusFromAPI();
});

const GUIDE_API_URL = "http://localhost:4000/api/guide-access";

/**
 * Obtiene el token JWT del storage local de la extensión
 */
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["tiltguardToken"], (result) => {
      resolve(result.tiltguardToken || null);
    });
  });
}

/**
 * Carga el estado de guías desde el backend API
 */
async function loadGuideStatusFromAPI() {
  try {
    const token = await getAuthToken();
    if (!token) {
      // Sin token, usar chrome.storage como fallback
      loadFromChromeStorage();
      return;
    }

    const response = await fetch(`${GUIDE_API_URL}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      loadFromChromeStorage();
      return;
    }

    const data = await response.json();
    if (!data.success) {
      loadFromChromeStorage();
      return;
    }

    const { setupCompleted, cooldownUntil, accessUntil } = data.data;
    const now = Date.now();
    const cooldownUntilMs = cooldownUntil
      ? new Date(cooldownUntil).getTime()
      : null;
    const accessUntilMs = accessUntil ? new Date(accessUntil).getTime() : null;

    // Sincronizar con chrome.storage
    chrome.storage.sync.set({
      setupGuideCompleted: setupCompleted || false,
      cooldownUntil: cooldownUntilMs,
      accessUntil: accessUntilMs,
    });

    initializeGuide();

    if (setupCompleted) {
      if (cooldownUntilMs && now < cooldownUntilMs) {
        const blockContent = document.getElementById("accessBlockContent");
        blockContent.innerHTML = `
          <h2>⏳ Procesando solicitud...</h2>
          <p>Por favor espera:</p>
          <div class="access-timer">
            <strong id="cooldownTime">--:--:--</strong>
          </div>
        `;
        document.getElementById("accessBlockOverlay").style.display = "flex";
        showCooldownTimerDisplay(cooldownUntilMs);
      } else if (accessUntilMs && now < accessUntilMs) {
        document.getElementById("accessBlockOverlay").style.display = "none";
        startFreeAccessTimer(accessUntilMs);
      } else {
        showRequestAccessOverlay();
      }
    } else {
      const overlay = document.getElementById("accessBlockOverlay");
      if (overlay) {
        overlay.style.display = "none";
      }
    }
  } catch (error) {
    loadFromChromeStorage();
  }
}

/**
 * Fallback: cargar estado desde chrome.storage si API no está disponible
 */
function loadFromChromeStorage() {
  chrome.storage.sync.get(
    ["setupGuideCompleted", "accessUntil", "cooldownUntil"],
    (result) => {
      const isSetupCompleted = result.setupGuideCompleted === true;
      const now = Date.now();
      const hasActiveAccess = result.accessUntil && now < result.accessUntil;
      const hasCooldown = result.cooldownUntil && now < result.cooldownUntil;

      initializeGuide();

      if (isSetupCompleted) {
        if (hasCooldown) {
          const blockContent = document.getElementById("accessBlockContent");
          blockContent.innerHTML = `
          <h2>⏳ Procesando solicitud...</h2>
          <p>Por favor espera:</p>
          <div class="access-timer">
            <strong id="cooldownTime">--:--:--</strong>
          </div>
        `;
          document.getElementById("accessBlockOverlay").style.display = "flex";
          showCooldownTimerDisplay(result.cooldownUntil);
        } else if (hasActiveAccess) {
          document.getElementById("accessBlockOverlay").style.display = "none";
          startFreeAccessTimer(result.accessUntil);
        } else {
          showRequestAccessOverlay();
        }
      } else {
        const overlay = document.getElementById("accessBlockOverlay");
        if (overlay) {
          overlay.style.display = "none";
        }
      }
    },
  );
}

// Funciones para la modal de confirmación
let pendingAction = null;

function showConfirmationModal(title, message, onConfirm) {
  const confirmationModal = document.getElementById("confirmationModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  confirmationModal.classList.add("active");
  pendingAction = onConfirm;

  // Limpiar listeners anteriores
  const newCancelBtn = modalCancelBtn.cloneNode(true);
  const newConfirmBtn = modalConfirmBtn.cloneNode(true);
  modalCancelBtn.parentNode.replaceChild(newCancelBtn, modalCancelBtn);
  modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, modalConfirmBtn);

  newCancelBtn.addEventListener("click", closeConfirmationModal);
  newConfirmBtn.addEventListener("click", () => {
    if (pendingAction) {
      pendingAction();
    }
    closeConfirmationModal();
  });

  // Cerrar modal si se hace clic fuera
  confirmationModal.addEventListener("click", (e) => {
    if (e.target === confirmationModal) {
      closeConfirmationModal();
    }
  });
}

function closeConfirmationModal() {
  const confirmationModal = document.getElementById("confirmationModal");
  confirmationModal.classList.remove("active");
  pendingAction = null;
}

function showRequestAccessOverlay() {
  const overlay = document.getElementById("accessBlockOverlay");
  overlay.style.display = "flex";

  const blockContent = document.getElementById("accessBlockContent");
  blockContent.innerHTML = `
    <h2>🔐 Acceso Restringido</h2>
    <p>Ya has completado la configuración. Si necesitas volver a revisar las guías, solicita acceso.</p>
    <button class="request-btn" id="requestAccessBtn">
      📋 Solicitar acceso
    </button>
  `;

  const requestBtn = document.getElementById("requestAccessBtn");
  requestBtn.addEventListener("click", () => {
    startCooldownTimer();
  });
}

function startCooldownTimer() {
  // Llama al API para solicitar acceso (2 horas de cooldown)

  const timerDisplay = document.getElementById("accessTimer");
  if (timerDisplay) {
    timerDisplay.style.display = "flex";
    const timerLabel = timerDisplay.querySelector(".timer-label");
    if (timerLabel) {
      timerLabel.textContent = "⏳ Cooldown:";
    }
  }

  const blockContent = document.getElementById("accessBlockContent");
  blockContent.innerHTML = `
    <h2>⏳ Solicitando acceso...</h2>
    <p>Por favor espera:</p>
    <div class="access-timer">
      <strong id="cooldownTime">--:--:--</strong>
    </div>
  `;

  // Llamar al API del backend
  getAuthToken().then(async (token) => {
    if (!token) {
      // Fallback sin API: usar 2h localmente
      const now = Date.now();
      const cooldownUntil = now + 2 * 60 * 60 * 1000; // 2 horas
      chrome.storage.sync.set({ cooldownUntil: cooldownUntil }, () => {
        showCooldownTimerDisplay(cooldownUntil);
      });
      return;
    }

    try {
      const response = await fetch(`${GUIDE_API_URL}/request-access`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success && data.data.cooldownUntil) {
        const cooldownUntilMs = new Date(data.data.cooldownUntil).getTime();
        chrome.storage.sync.set({ cooldownUntil: cooldownUntilMs }, () => {
          showCooldownTimerDisplay(cooldownUntilMs);
        });
      } else {
        // Error from API, fallback
        const now = Date.now();
        const cooldownUntil = now + 2 * 60 * 60 * 1000;
        chrome.storage.sync.set({ cooldownUntil: cooldownUntil }, () => {
          showCooldownTimerDisplay(cooldownUntil);
        });
      }
    } catch (error) {
      const now = Date.now();
      const cooldownUntil = now + 2 * 60 * 60 * 1000;
      chrome.storage.sync.set({ cooldownUntil: cooldownUntil }, () => {
        showCooldownTimerDisplay(cooldownUntil);
      });
    }
  });
}

function showCooldownTimerDisplay(cooldownUntil) {
  let intervalId = null;

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function updateCooldownDisplay() {
    const now = Date.now();
    const remaining = cooldownUntil - now;

    const timeString = formatTime(remaining);

    // Contador en el overlay
    const cooldownTimeEl = document.getElementById("cooldownTime");
    if (cooldownTimeEl) {
      cooldownTimeEl.textContent = timeString;
    }

    // Contador en la esquina superior derecha
    const timerValueEl = document.querySelector(".timer-value");
    if (timerValueEl) {
      timerValueEl.textContent = timeString;
    }

    if (remaining <= 0) {
      if (intervalId) clearInterval(intervalId);
      document.getElementById("accessBlockOverlay").style.display = "none";

      // Cooldown terminado → obtener accessUntil del backend
      getAuthToken().then(async (token) => {
        if (token) {
          try {
            // Re-fetch status — backend auto-grants 24h access when cooldown expires
            const response = await fetch(`${GUIDE_API_URL}/status`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success && data.data.accessUntil) {
              const accessUntilMs = new Date(data.data.accessUntil).getTime();
              chrome.storage.sync.set(
                {
                  accessUntil: accessUntilMs,
                  cooldownUntil: null,
                },
                () => {
                  startFreeAccessTimer(accessUntilMs);
                },
              );
              return;
            }
          } catch (e) {
            // fallback below
          }
        }
        // Fallback: 24 horas de acceso local
        const accessUntil = Date.now() + 24 * 60 * 60 * 1000;
        chrome.storage.sync.set(
          {
            accessUntil: accessUntil,
            cooldownUntil: null,
          },
          () => {
            startFreeAccessTimer(accessUntil);
          },
        );
      });
      return;
    }
  }

  updateCooldownDisplay();
  intervalId = setInterval(updateCooldownDisplay, 1000);
}

function startFreeAccessTimer(accessUntil) {
  // Timer de acceso libre (24 horas) — overlay oculto

  const timerDisplay = document.getElementById("accessTimer");

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  if (timerDisplay) {
    timerDisplay.style.display = "flex";
    const timerLabel = timerDisplay.querySelector(".timer-label");
    if (timerLabel) {
      timerLabel.textContent = "⏱️ Acceso:";
    }
    const timerValueEl = timerDisplay.querySelector(".timer-value");
    if (timerValueEl) {
      timerValueEl.textContent = formatTime(accessUntil - Date.now());
    }
  }

  let intervalId = null;

  function updateAccessDisplay() {
    const now = Date.now();
    const remaining = accessUntil - now;

    const timerValueEl = document.querySelector(".timer-value");
    if (timerValueEl) {
      timerValueEl.textContent = formatTime(remaining);
    }

    if (remaining <= 0) {
      if (intervalId) clearInterval(intervalId);
      if (timerDisplay) {
        timerDisplay.style.display = "none";
      }
      chrome.storage.sync.remove(["accessUntil", "cooldownUntil"], () => {
        showRequestAccessOverlay();
      });
      return;
    }
  }

  updateAccessDisplay();
  intervalId = setInterval(updateAccessDisplay, 1000);
}

function initializeGuide() {
  const browserSelector = document.getElementById("browser-selector");
  const changeBrowserLink = document.getElementById("change-browser-link");
  const detectedBrowserEl = document.getElementById("detected-browser");
  const detectedOsEl = document.getElementById("detected-os");
  const mainBtns = document.querySelectorAll(".main-btn");
  const doneBtn = document.getElementById("doneBtn");

  if (!detectedBrowserEl || !detectedOsEl) {
    return;
  }

  // Obtener el ID de la extensión
  const extensionId = chrome.runtime.id;

  // Detectar navegador y SO automáticamente
  const detectedBrowser = detectBrowser();
  const detectedOS = detectOS();

  // Mostrar lo detectado
  detectedBrowserEl.textContent = detectedBrowser.name;
  detectedOsEl.textContent = detectedOS.name;

  // Manejar cambio de navegador
  changeBrowserLink.addEventListener("click", (e) => {
    e.preventDefault();
    browserSelector.style.display =
      browserSelector.style.display === "none" ? "inline-block" : "none";
  });

  browserSelector.addEventListener("change", () => {
    const selectedBrowser = browserSelector.value;
    if (selectedBrowser) {
      const browserInfo = getBrowserInfo(selectedBrowser);
      detectedBrowserEl.textContent = browserInfo.name;
      updateGuides(detectedOS.id, getCurrentMainType(), selectedBrowser);
    }
  });

  // Reemplazar todos los "tu_extension_id" con el ID real
  document.querySelectorAll(".code-block").forEach((block) => {
    block.innerHTML = block.innerHTML.replace(/tu_extension_id/g, extensionId);
  });

  // También reemplazar en los ejemplos
  document.querySelectorAll(".extension-id-example").forEach((el) => {
    el.textContent = extensionId;
  });

  // Manejar cambio entre Instalación y Desinstalación
  mainBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mainType = btn.dataset.mainType;

      // Actualizar botones activos
      mainBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Mostrar/ocultar botón según tipo
      if (mainType === "install") {
        doneBtn.style.display = "inline-flex";
        doneBtn.textContent = "✓ Ya he completado la instalación";
      } else {
        doneBtn.style.display = "inline-flex";
        doneBtn.innerHTML =
          '<span class="done-icon">✓</span> Ya he completado la desinstalación';
      }

      // Actualizar guías (mostrar ambas: extension e incognito)
      const selectedBrowser =
        document.getElementById("browser-selector").value || detectedBrowser.id;
      updateGuides(detectedOS.id, mainType, selectedBrowser);
    });
  });

  // Event listener para el botón de finalización
  doneBtn.addEventListener("click", () => {
    const mainType = getCurrentMainType();
    const title =
      mainType === "install"
        ? "¿Completar instalación?"
        : "¿Desinstalar la extensión?";
    const message =
      mainType === "install"
        ? "Confirma que has completado todos los pasos de instalación."
        : "Esto desactivará el bloqueo de la extensión. ¿Deseas continuar?";

    showConfirmationModal(title, message, () => {
      completeSetup();
    });
  });

  // Mostrar la guía inicial (instalación)
  const selectedBrowser =
    document.getElementById("browser-selector").value || detectedBrowser.id;
  updateGuides(detectedOS.id, "install", selectedBrowser);
  doneBtn.style.display = "inline-flex";
  doneBtn.textContent = "✓ Ya he completado la instalación";

  // Verificar si ya se ha completado la instalación antes para habilitar desinstalación
  chrome.storage.sync.get(["setupGuideCompleted"], (result) => {
    if (result.setupGuideCompleted === true) {
      const uninstallBtn = document.querySelector(
        '.main-btn[data-main-type="uninstall"]',
      );
      if (uninstallBtn) {
        uninstallBtn.disabled = false;
      }
    }
  });
}

function showCooldownScreen(cooldownUntil) {
  // Ocultar contenido principal
  document.querySelector(".controls").style.display = "none";
  document.querySelectorAll(".guide-section").forEach((section) => {
    section.style.display = "none";
  });

  // Mostrar pantalla de cooldown
  const overlay = document.getElementById("cooldownOverlay");
  overlay.style.display = "flex";

  const closeBtn = document.getElementById("closeBtn");
  closeBtn.addEventListener("click", () => {
    window.close();
  });

  // Actualizar timer
  function updateCooldownDisplay() {
    const now = Date.now();
    const remaining = cooldownUntil - now;

    if (remaining <= 0) {
      // Cooldown expirado, cerrar ventana
      window.close();
      return;
    }

    // Calcular horas, minutos y segundos
    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const timeString = `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    document.getElementById("cooldownTime").textContent = timeString;
  }

  // Actualizar cada segundo
  updateCooldownDisplay();
  setInterval(updateCooldownDisplay, 1000);
}

function completeSetup() {
  const mainType = getCurrentMainType();

  getAuthToken().then(async (token) => {
    if (mainType === "install") {
      // Llamar al API para marcar setup como completado
      if (token) {
        try {
          await fetch(`${GUIDE_API_URL}/complete-setup`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } catch (e) {
          // Continue with local storage fallback
        }
      }

      chrome.storage.sync.set({ setupGuideCompleted: true }, () => {
        const uninstallBtn = document.querySelector(
          '.main-btn[data-main-type="uninstall"]',
        );
        if (uninstallBtn) {
          uninstallBtn.disabled = false;
        }
        setTimeout(() => {
          window.close();
        }, 500);
      });
    } else if (mainType === "uninstall") {
      // Llamar al API para deshacer setup
      if (token) {
        try {
          await fetch(`${GUIDE_API_URL}/undo-setup`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } catch (e) {
          // Continue with local storage fallback
        }
      }

      chrome.storage.sync.remove(
        ["setupGuideCompleted", "accessUntil", "cooldownUntil"],
        () => {
          alert("Bloqueo desactivado. Ahora puedes cerrar esta ventana.");
          window.close();
        },
      );
    }
  });
}

function completeInstallation() {
  // Esta función se mantiene para compatibilidad pero no se usa
}

function getCurrentMainType() {
  const activeBtn = document.querySelector(".main-btn.active");
  return activeBtn ? activeBtn.dataset.mainType : "install";
}

function updateGuides(osId, mainType, browserId = "") {
  // Validar parámetros
  if (!osId || !mainType) {
    return;
  }

  // Ocultar todas las guías
  const allGuides = document.querySelectorAll(".guide-section");

  if (allGuides.length === 0) {
    return;
  }

  allGuides.forEach((section) => {
    section.style.display = "none";
  });

  // Usar el navegador proporcionado o detectado
  const browserToUse = browserId || detectBrowser().id;
  const mode = mainType === "install" ? "install" : "uninstall";

  // Mostrar ambas guías en secuencia: extension + incognito
  const guides = ["extension", "incognito"];
  let foundCount = 0;
  const searchedGuides = [];

  guides.forEach((guideType) => {
    let guideId;
    if (guideType === "incognito") {
      const incognitoMode = mainType === "install" ? "activate" : "deactivate";
      guideId = `guide-${osId}-${browserToUse}-${guideType}-${incognitoMode}`;
    } else {
      // extension
      guideId = `guide-${osId}-${browserToUse}-${guideType}-${mode}`;
    }

    searchedGuides.push(guideId);

    const guideElement = document.getElementById(guideId);
    if (guideElement) {
      guideElement.style.display = "block";
      foundCount++;
    } else {
      // Debug: listar guías disponibles que coinciden parcialmente
      const availableGuides = Array.from(allGuides).map((el) => el.id);
      const similarGuides = availableGuides.filter((id) => {
        return id && id.includes(osId) && id.includes(browserToUse);
      });

      if (similarGuides.length > 0) {
        // Similar guides found
      } else {
        // No similar guides
      }
    }
  });

  if (foundCount === 0) {
    // No guides were shown
  }
}

function detectBrowser() {
  const userAgent = navigator.userAgent;
  let browserName = "Chrome";
  let browserId = "chrome";

  if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserId = "firefox";
  } else if (userAgent.indexOf("Edg") > -1) {
    browserName = "Microsoft Edge";
    browserId = "edge";
  } else if (userAgent.indexOf("OPR") > -1 || userAgent.indexOf("Opera") > -1) {
    browserName = "Opera";
    browserId = "opera";
  } else if (userAgent.indexOf("Brave") > -1) {
    browserName = "Brave";
    browserId = "brave";
  } else if (userAgent.indexOf("Vivaldi") > -1) {
    browserName = "Vivaldi";
    browserId = "vivaldi";
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Google Chrome";
    browserId = "chrome";
  }

  return { name: browserName, id: browserId };
}

function getBrowserInfo(browserId) {
  const browsers = {
    chrome: { name: "Google Chrome", id: "chrome" },
    chromium: { name: "Chromium", id: "chromium" },
    firefox: { name: "Mozilla Firefox", id: "firefox" },
    edge: { name: "Microsoft Edge", id: "edge" },
    opera: { name: "Opera", id: "opera" },
    brave: { name: "Brave", id: "brave" },
    vivaldi: { name: "Vivaldi", id: "vivaldi" },
  };
  return browsers[browserId] || browsers.chrome;
}

function detectOS() {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf("Win") > -1) {
    return { name: "Windows", id: "windows" };
  } else if (userAgent.indexOf("Mac") > -1) {
    return { name: "macOS", id: "mac" };
  } else if (userAgent.indexOf("Linux") > -1) {
    return { name: "Linux", id: "linux" };
  } else {
    return { name: "Windows", id: "windows" };
  }
}
