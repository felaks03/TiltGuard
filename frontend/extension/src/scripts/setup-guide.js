document.addEventListener("DOMContentLoaded", () => {
  // Verificar que chrome.runtime esté disponible
  if (!chrome || !chrome.runtime) {
    // En modo web puro, solo inicializar sin verificar storage
    initializeGuide();
    return;
  }

  // Verificar si el usuario completó la instalación
  chrome.storage.sync.get(
    ["setupGuideCompleted", "accessUntil", "cooldownUntil"],
    (result) => {
      const isSetupCompleted = result.setupGuideCompleted === true;
      const now = Date.now();
      const hasActiveAccess = result.accessUntil && now < result.accessUntil;
      const hasCooldown = result.cooldownUntil && now < result.cooldownUntil;

      // Inicializar la guía en cualquier caso
      initializeGuide();

      if (isSetupCompleted) {
        if (hasCooldown) {
          // El usuario está en cooldown, mostrar timer de cooldown
          const blockContent = document.getElementById("accessBlockContent");
          blockContent.innerHTML = `
          <h2>⏳ Procesando solicitud...</h2>
          <p>Por favor espera:</p>
          <div class="access-timer">
            <strong id="cooldownTime">0:15</strong>
          </div>
        `;
          document.getElementById("accessBlockOverlay").style.display = "flex";
          showCooldownTimerDisplay(result.cooldownUntil);
        } else if (hasActiveAccess) {
          // Timer activo - mostrar las guías libremente con timer de 20 segundos de visualización
          document.getElementById("accessBlockOverlay").style.display = "none";
          startFreeAccessTimer(result.accessUntil);
        } else {
          // Setup completado pero sin acceso activo - mostrar overlay con "Solicitar acceso"
          showRequestAccessOverlay();
        }
      } else {
        // Primera vez - sin restricciones
        const overlay = document.getElementById("accessBlockOverlay");
        if (overlay) {
          overlay.style.display = "none";
        }
      }
    },
  );
});

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

/**
 * Obtiene la hora actual del servidor usando worldtimeapi.org
 * Sincroniza el reloj del navegador con un servidor para evitar manipulaciones
 * @returns {Promise<number>} Timestamp en milisegundos
 */
async function getServerTime() {
  try {
    const response = await fetch(
      "https://worldtimeapi.org/api/timezone/Etc/UTC",
      {
        cache: "no-cache",
      },
    );

    if (!response.ok) throw new Error("API error: " + response.status);

    const data = await response.json();
    const serverTime = new Date(data.utc_datetime).getTime();

    return serverTime;
  } catch (error) {
    // Fallback: usar hora local
    return Date.now();
  }
}

function startCooldownTimer() {
  // Timer 1: 10 segundos de cooldown (overlay visible con contador)

  // Mostrar contador de acceso en la esquina superior derecha
  const timerDisplay = document.getElementById("accessTimer");
  if (timerDisplay) {
    timerDisplay.style.display = "flex";
    // Actualizar label a "Cooldown"
    const timerLabel = timerDisplay.querySelector(".timer-label");
    if (timerLabel) {
      timerLabel.textContent = "⏳ Cooldown:";
    }
  }

  const blockContent = document.getElementById("accessBlockContent");
  blockContent.innerHTML = `
    <h2>⏳ Procesando solicitud...</h2>
    <p>Por favor espera:</p>
    <div class="access-timer">
      <strong id="cooldownTime">0:10</strong>
    </div>
  `;

  // Obtener tiempo del servidor
  getServerTime()
    .then((serverNow) => {
      const cooldownUntil = serverNow + 10 * 1000; // 10 segundos

      // Guardar en storage para sincronización si se recarga la página
      chrome.storage.sync.set({ cooldownUntil: cooldownUntil }, () => {
        showCooldownTimerDisplay(cooldownUntil);
      });
    })
    .catch((error) => {
      // Fallback: usar hora local si API falla
      const now = Date.now();
      const cooldownUntil = now + 10 * 1000;
      chrome.storage.sync.set({ cooldownUntil: cooldownUntil }, () => {
        showCooldownTimerDisplay(cooldownUntil);
      });
    });
}

function showCooldownTimerDisplay(cooldownUntil) {
  let intervalId = null;

  async function updateCooldownDisplay() {
    try {
      // Obtener hora del servidor para máxima precisión
      const serverNow = await getServerTime();
      const remaining = cooldownUntil - serverNow;

      // Actualizar ambos contadores (overlay y esquina superior)
      const totalSeconds = Math.ceil(remaining / 1000);
      const timeString = `0:${String(totalSeconds).padStart(2, "0")}`;

      // Contador en el overlay
      const cooldownTimeEl = document.getElementById("cooldownTime");
      if (cooldownTimeEl) {
        cooldownTimeEl.textContent = timeString;
      }

      // Contador en la esquina superior derecha
      const timerValueEl = document.querySelector(".timer-value");
      if (timerValueEl) {
        timerValueEl.textContent = `${totalSeconds}s`;
      }

      if (remaining <= 0) {
        // Cooldown completado, iniciar acceso de 10 segundos

        if (intervalId) clearInterval(intervalId);

        document.getElementById("accessBlockOverlay").style.display = "none";

        // Obtener hora del servidor para el nuevo timer
        const now = await getServerTime();
        const accessUntil = now + 5 * 1000; // 5 segundos de acceso

        chrome.storage.sync.set(
          {
            accessUntil: accessUntil,
            cooldownUntil: null,
          },
          () => {
            startFreeAccessTimer(accessUntil);
          },
        );
        return;
      }
    } catch (error) {
      // Fallback a hora local si falla la API
      const now = Date.now();
      const remaining = cooldownUntil - now;

      const totalSeconds = Math.ceil(remaining / 1000);
      const timeString = `0:${String(totalSeconds).padStart(2, "0")}`;

      // Actualizar contador en overlay
      const cooldownTimeEl = document.getElementById("cooldownTime");
      if (cooldownTimeEl) {
        cooldownTimeEl.textContent = timeString;
      }

      // Actualizar contador en esquina superior
      const timerValueEl = document.querySelector(".timer-value");
      if (timerValueEl) {
        timerValueEl.textContent = `${totalSeconds}s`;
      }

      if (remaining <= 0) {
        if (intervalId) clearInterval(intervalId);
        document.getElementById("accessBlockOverlay").style.display = "none";
        const accessUntil = now + 5 * 1000;
        chrome.storage.sync.set({ accessUntil: accessUntil }, () => {
          startFreeAccessTimer(accessUntil);
        });
        return;
      }
    }
  }

  // Actualizar cada 100ms para mejor precisión
  updateCooldownDisplay();
  intervalId = setInterval(updateCooldownDisplay, 100);
}

function startFreeAccessTimer(accessUntil) {
  // Timer 2: 10 segundos de acceso libre (overlay oculto)

  // Mostrar contador de acceso en la esquina superior derecha
  const timerDisplay = document.getElementById("accessTimer");

  if (timerDisplay) {
    timerDisplay.style.display = "flex";

    // Actualizar label a "Acceso"
    const timerLabel = timerDisplay.querySelector(".timer-label");
    if (timerLabel) {
      timerLabel.textContent = "⏱️ Acceso:";
    }

    // Set initial value synchronously to avoid blank counter
    const timerValueEl = timerDisplay.querySelector(".timer-value");
    if (timerValueEl) {
      const now = Date.now();
      const remaining = accessUntil - now;
      const seconds = Math.max(0, Math.ceil(remaining / 1000));
      timerValueEl.textContent = `${seconds}s`;
    }
  } else {
    // Element not found
  }

  let intervalId = null;

  async function updateAccessDisplay() {
    try {
      // Obtener hora del servidor para máxima precisión
      const serverNow = await getServerTime();
      const remaining = accessUntil - serverNow;

      // Actualizar contador visible
      const timerValueEl = document.querySelector(".timer-value");
      if (timerValueEl) {
        const seconds = Math.max(0, Math.ceil(remaining / 1000));
        timerValueEl.textContent = `${seconds}s`;
      } else {
        // timer-value element not found
      }

      if (remaining <= 0) {
        // Acceso expirado, cerrar ventana

        if (intervalId) {
          clearInterval(intervalId);
        }

        // Ocultar contador
        if (timerDisplay) {
          timerDisplay.style.display = "none";
        }

        chrome.storage.sync.remove(["accessUntil", "cooldownUntil"], () => {
          setTimeout(() => {
            window.close();
          }, 500);
        });
        return;
      }
    } catch (error) {
      // Fallback a hora local si falla la API
      const now = Date.now();
      const remaining = accessUntil - now;

      // Actualizar contador con fallback
      const timerValueEl = document.querySelector(".timer-value");
      if (timerValueEl) {
        const seconds = Math.max(0, Math.ceil(remaining / 1000));
        timerValueEl.textContent = `${seconds}s`;
      }

      if (remaining <= 0) {
        if (intervalId) clearInterval(intervalId);
        if (timerDisplay) {
          timerDisplay.style.display = "none";
        }
        chrome.storage.sync.remove(["accessUntil", "cooldownUntil"], () => {
          setTimeout(() => {
            window.close();
          }, 500);
        });
        return;
      }
    }
  }

  // Actualizar inmediatamente y luego cada segundo
  updateAccessDisplay().catch(() => {});

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

  if (mainType === "install") {
    // Guardar que completó la instalación y habilitar botón de desinstalación
    chrome.storage.sync.set({ setupGuideCompleted: true }, () => {
      // Habilitar botón de desinstalación
      const uninstallBtn = document.querySelector(
        '.main-btn[data-main-type="uninstall"]',
      );
      if (uninstallBtn) {
        uninstallBtn.disabled = false;
      }

      // Cerrar la ventana después de guardar
      setTimeout(() => {
        window.close();
      }, 500);
    });
  } else if (mainType === "uninstall") {
    // Remover el bloqueo
    chrome.storage.sync.remove(["setupGuideCompleted", "accessUntil"], () => {
      alert("Bloqueo desactivado. Ahora puedes cerrar esta ventana.");
      window.close();
    });
  }
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
