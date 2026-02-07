document.addEventListener("DOMContentLoaded", () => {
  console.log("[DOMContentLoaded] Event fired - iniciando setup");

  // Verificar que chrome.runtime esté disponible
  if (!chrome || !chrome.runtime) {
    console.error(
      "[DOMContentLoaded] chrome.runtime no disponible - modo web puro?",
    );
    // En modo web puro, solo inicializar sin verificar storage
    initializeGuide();
    return;
  }

  // Verificar si el usuario completó la instalación
  chrome.storage.sync.get(
    ["setupGuideCompleted", "accessUntil", "cooldownUntil"],
    (result) => {
      console.log("[DOMContentLoaded] Storage check result:", {
        setupGuideCompleted: result.setupGuideCompleted,
        accessUntil: result.accessUntil,
        cooldownUntil: result.cooldownUntil,
        now: Date.now(),
      });

      const isSetupCompleted = result.setupGuideCompleted === true;
      const now = Date.now();
      const hasActiveAccess = result.accessUntil && now < result.accessUntil;
      const hasCooldown = result.cooldownUntil && now < result.cooldownUntil;

      console.log("[DOMContentLoaded] Status:", {
        isSetupCompleted,
        hasActiveAccess,
        hasCooldown,
        timeUntilAccessExpires: hasActiveAccess
          ? result.accessUntil - now
          : null,
        timeUntilCooldownExpires: hasCooldown
          ? result.cooldownUntil - now
          : null,
      });

      // Inicializar la guía en cualquier caso
      console.log("[DOMContentLoaded] Calling initializeGuide()");
      initializeGuide();

      if (isSetupCompleted) {
        if (hasCooldown) {
          // El usuario está en cooldown, mostrar timer de cooldown
          console.log(
            "[DOMContentLoaded] Cooldown en progreso. Mostrando contador.",
          );
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
          console.log(
            "[DOMContentLoaded] Active access detected. Showing guides with 20-second timer.",
          );
          document.getElementById("accessBlockOverlay").style.display = "none";
          startFreeAccessTimer(result.accessUntil);
        } else {
          // Setup completado pero sin acceso activo - mostrar overlay con "Solicitar acceso"
          console.log(
            "[DOMContentLoaded] Setup completed. Showing request access overlay.",
          );
          showRequestAccessOverlay();
        }
      } else {
        // Primera vez - sin restricciones
        console.log(
          "[DOMContentLoaded] First time access. Guides visible without restrictions.",
        );
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
    console.log("[showRequestAccessOverlay] Usuario solicitó acceso");
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

    console.log(
      "[getServerTime] Hora del servidor obtenida:",
      new Date(serverTime).toISOString(),
    );
    return serverTime;
  } catch (error) {
    console.error("[getServerTime] Error al obtener hora del servidor:", error);
    // Fallback: usar hora local
    return Date.now();
  }
}

function startCooldownTimer() {
  // Timer 1: 10 segundos de cooldown (overlay visible con contador)
  console.log(
    "[startCooldownTimer] Iniciando timer de cooldown de 10 segundos",
  );

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
      console.log(
        "[startCooldownTimer] Timer de cooldown set until:",
        new Date(cooldownUntil).toISOString(),
      );

      // Guardar en storage para sincronización si se recarga la página
      chrome.storage.sync.set({ cooldownUntil: cooldownUntil }, () => {
        showCooldownTimerDisplay(cooldownUntil);
      });
    })
    .catch((error) => {
      console.error(
        "[startCooldownTimer] Error al obtener tiempo del servidor:",
        error,
      );
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
        console.log(
          "[showCooldownTimerDisplay] Cooldown completado. Iniciando acceso de 10 segundos.",
        );

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
            console.log(
              "[showCooldownTimerDisplay] Acceso guardado hasta:",
              new Date(accessUntil).toISOString(),
            );
            startFreeAccessTimer(accessUntil);
          },
        );
        return;
      }
    } catch (error) {
      console.error(
        "[showCooldownTimerDisplay] Error en updateCooldownDisplay:",
        error,
      );
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
  console.log(
    "[startFreeAccessTimer] INICIADO - Acceso libre hasta:",
    new Date(accessUntil).toISOString(),
  );

  // Mostrar contador de acceso en la esquina superior derecha
  const timerDisplay = document.getElementById("accessTimer");
  console.log(
    "[startFreeAccessTimer] timerDisplay element found:",
    !!timerDisplay,
  );

  if (timerDisplay) {
    timerDisplay.style.display = "flex";
    console.log("[startFreeAccessTimer] Timer display set to flex");

    // Actualizar label a "Acceso"
    const timerLabel = timerDisplay.querySelector(".timer-label");
    if (timerLabel) {
      timerLabel.textContent = "⏱️ Acceso:";
      console.log("[startFreeAccessTimer] Label updated to Acceso");
    }

    // Set initial value synchronously to avoid blank counter
    const timerValueEl = timerDisplay.querySelector(".timer-value");
    if (timerValueEl) {
      const now = Date.now();
      const remaining = accessUntil - now;
      const seconds = Math.max(0, Math.ceil(remaining / 1000));
      timerValueEl.textContent = `${seconds}s`;
      console.log(
        "[startFreeAccessTimer] Initial counter set to:",
        `${seconds}s`,
      );
    }
  } else {
    console.error(
      "[startFreeAccessTimer] ERROR: accessTimer element NOT found!",
    );
  }

  let intervalId = null;

  async function updateAccessDisplay() {
    console.log("[updateAccessDisplay] Called - fetching server time...");
    try {
      // Obtener hora del servidor para máxima precisión
      const serverNow = await getServerTime();
      const remaining = accessUntil - serverNow;

      console.log(
        "[updateAccessDisplay] Server time received. Remaining:",
        remaining,
        "ms",
      );

      // Actualizar contador visible
      const timerValueEl = document.querySelector(".timer-value");
      if (timerValueEl) {
        const seconds = Math.max(0, Math.ceil(remaining / 1000));
        timerValueEl.textContent = `${seconds}s`;
        console.log("[updateAccessDisplay] Counter updated to:", `${seconds}s`);
      } else {
        console.warn("[updateAccessDisplay] timer-value element not found");
      }

      if (remaining <= 0) {
        // Acceso expirado, cerrar ventana
        console.log("[updateAccessDisplay] Access EXPIRED. Closing window...");

        if (intervalId) {
          clearInterval(intervalId);
          console.log("[updateAccessDisplay] Interval cleared");
        }

        // Ocultar contador
        if (timerDisplay) {
          timerDisplay.style.display = "none";
        }

        chrome.storage.sync.remove(["accessUntil", "cooldownUntil"], () => {
          console.log(
            "[updateAccessDisplay] Storage cleared. Window will close...",
          );
          setTimeout(() => {
            console.log("[updateAccessDisplay] Executing window.close()");
            window.close();
          }, 500);
        });
        return;
      }
    } catch (error) {
      console.error(
        "[updateAccessDisplay] Error during async operation:",
        error,
      );
      // Fallback a hora local si falla la API
      const now = Date.now();
      const remaining = accessUntil - now;

      console.log(
        "[updateAccessDisplay] Using fallback (local time). Remaining:",
        remaining,
      );

      // Actualizar contador con fallback
      const timerValueEl = document.querySelector(".timer-value");
      if (timerValueEl) {
        const seconds = Math.max(0, Math.ceil(remaining / 1000));
        timerValueEl.textContent = `${seconds}s`;
        console.log(
          "[updateAccessDisplay] Fallback counter updated to:",
          `${seconds}s`,
        );
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
  console.log(
    "[startFreeAccessTimer] Calling updateAccessDisplay immediately...",
  );
  updateAccessDisplay().catch((err) => {
    console.error("[startFreeAccessTimer] updateAccessDisplay error:", err);
  });

  intervalId = setInterval(updateAccessDisplay, 1000);
  console.log("[startFreeAccessTimer] Interval set up (1000ms)");
}

function initializeGuide() {
  console.log("=== [initializeGuide] INICIANDO ===");
  const browserSelector = document.getElementById("browser-selector");
  const changeBrowserLink = document.getElementById("change-browser-link");
  const detectedBrowserEl = document.getElementById("detected-browser");
  const detectedOsEl = document.getElementById("detected-os");
  const mainBtns = document.querySelectorAll(".main-btn");
  const doneBtn = document.getElementById("doneBtn");

  console.log("[initializeGuide] DOM elements check:", {
    browserSelector: !!browserSelector,
    changeBrowserLink: !!changeBrowserLink,
    detectedBrowserEl: !!detectedBrowserEl,
    detectedOsEl: !!detectedOsEl,
    mainBtns: mainBtns.length,
    doneBtn: !!doneBtn,
  });

  if (!detectedBrowserEl || !detectedOsEl) {
    console.error("[initializeGuide] FATAL: Missing required DOM elements!");
    return;
  }

  // Obtener el ID de la extensión
  const extensionId = chrome.runtime.id;

  // Detectar navegador y SO automáticamente
  const detectedBrowser = detectBrowser();
  const detectedOS = detectOS();

  console.log("[initializeGuide] Detection results:", {
    browser: detectedBrowser,
    os: detectedOS,
  });

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
      console.log(
        "[initializeGuide] Browser selected manually:",
        selectedBrowser,
      );
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
      console.log("[initializeGuide] Main button clicked:", mainType);

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
      console.log("[initializeGuide] Updating guides:", {
        os: detectedOS.id,
        mainType: mainType,
        browser: selectedBrowser,
      });
      updateGuides(detectedOS.id, mainType, selectedBrowser);
    });
  });

  // Event listener para el botón de finalización
  doneBtn.addEventListener("click", () => {
    console.log(
      "[initializeGuide] Done button clicked. MainType: " +
        getCurrentMainType(),
    );
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
  console.log(
    `[initializeGuide] Showing initial guides - OS: ${detectedOS.id}, Browser: ${selectedBrowser}, Type: install`,
  );
  updateGuides(detectedOS.id, "install", selectedBrowser);
  doneBtn.style.display = "inline-flex";
  doneBtn.textContent = "✓ Ya he completado la instalación";

  // Verificar si ya se ha completado la instalación antes para habilitar desinstalación
  chrome.storage.sync.get(["setupGuideCompleted"], (result) => {
    if (result.setupGuideCompleted === true) {
      console.log(
        "[initializeGuide] Setup ya fue completado, habilitando botón de desinstalación",
      );
      const uninstallBtn = document.querySelector(
        '.main-btn[data-main-type="uninstall"]',
      );
      if (uninstallBtn) {
        uninstallBtn.disabled = false;
      }
    }
  });

  console.log("=== [initializeGuide] COMPLETADO ===");
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
  console.log("Setup completado:", mainType);

  if (mainType === "install") {
    // Guardar que completó la instalación y habilitar botón de desinstalación
    chrome.storage.sync.set({ setupGuideCompleted: true }, () => {
      console.log(
        "Instalación completada. Habilitando botón de desinstalación.",
      );

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
      console.log("Desinstalación completada. Bloqueo removido.");
      alert("Bloqueo desactivado. Ahora puedes cerrar esta ventana.");
      window.close();
    });
  }
}

function completeInstallation() {
  // Esta función se mantiene para compatibilidad pero no se usa
  console.log("completeInstallation (deprecated)");
}

function getCurrentMainType() {
  const activeBtn = document.querySelector(".main-btn.active");
  return activeBtn ? activeBtn.dataset.mainType : "install";
}

function updateGuides(osId, mainType, browserId = "") {
  console.log(
    `[updateGuides] START - osId=${osId}, mainType=${mainType}, browserId=${browserId}`,
  );

  // Validar parámetros
  if (!osId || !mainType) {
    console.error(
      "[updateGuides] ERROR: Parámetros inválidos. osId y mainType son requeridos",
    );
    return;
  }

  // Ocultar todas las guías
  const allGuides = document.querySelectorAll(".guide-section");
  console.log(`[updateGuides] Total guide sections found: ${allGuides.length}`);

  if (allGuides.length === 0) {
    console.error("[updateGuides] FATAL: No guide sections found in DOM!");
    console.error(
      "[updateGuides] El HTML debería tener elementos con class='guide-section'",
    );
    return;
  }

  allGuides.forEach((section) => {
    section.style.display = "none";
  });

  // Usar el navegador proporcionado o detectado
  const browserToUse = browserId || detectBrowser().id;
  const mode = mainType === "install" ? "install" : "uninstall";

  console.log(
    `[updateGuides] Using: osId=${osId}, browser=${browserToUse}, mode=${mode}`,
  );

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
    console.log(`[updateGuides] Looking for guide: ${guideId}`);

    const guideElement = document.getElementById(guideId);
    if (guideElement) {
      guideElement.style.display = "block";
      foundCount++;
      console.log(`[updateGuides] ✓ Guide found and shown: ${guideId}`);
    } else {
      console.log(`[updateGuides] ✗ Guide NOT found: ${guideId}`);

      // Debug: listar guías disponibles que coinciden parcialmente
      const availableGuides = Array.from(allGuides).map((el) => el.id);
      const similarGuides = availableGuides.filter((id) => {
        return id && id.includes(osId) && id.includes(browserToUse);
      });

      if (similarGuides.length > 0) {
        console.log(
          `[updateGuides] Similar guides for ${osId}-${browserToUse}:`,
        );
        similarGuides.slice(0, 3).forEach((id) => console.log(`  - ${id}`));
      } else {
        console.log(
          `[updateGuides] No similar guides found for ${osId}-${browserToUse}`,
        );
        console.log(
          `[updateGuides] Available OS-Browser combinations (first 5):`,
        );
        const uniquePatterns = new Set();
        availableGuides.slice(0, 20).forEach((id) => {
          const match = id.match(/guide-([^-]+)-([^-]+)-/);
          if (match) {
            uniquePatterns.add(`${match[1]}-${match[2]}`);
          }
        });
        Array.from(uniquePatterns).forEach((pattern) => {
          console.log(`  - ${pattern}`);
        });
      }
    }
  });

  console.log(`[updateGuides] END - Successfully shown ${foundCount}/2 guides`);

  if (foundCount === 0) {
    console.error(
      "[updateGuides] WARNING: No guides were shown! Check browser/OS compatibility.",
    );
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
