document.addEventListener("DOMContentLoaded", () => {
  // TESTING: Limpiar datos guardados
  chrome.storage.sync.remove(["setupGuideCooldownUntil", "setupGuideCompleted"]);
  
  // Proceder normalmente sin bloqueos
  initializeGuide();
});

function showRequestScreen() {
  // Ocultar contenido principal
  document.querySelector(".controls").style.display = "none";
  document.querySelectorAll(".guide-section").forEach((section) => {
    section.style.display = "none";
  });

  // Mostrar pantalla de solicitud
  const requestScreen = document.getElementById("requestScreen");
  requestScreen.style.display = "flex";

  const requestAccessBtn = document.getElementById("requestAccessBtn");
  requestAccessBtn.addEventListener("click", activateTimer);
}

async function activateTimer() {
  try {
    // Obtener tiempo actual de la API
    const response = await fetch(
      "https://worldtimeapi.org/api/timezone/Etc/UTC",
    );
    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    const currentTime = new Date(data.datetime).getTime();

    // Calcular tiempo de espera: 1 minuto desde ahora
    const cooldownUntil = currentTime + 1 * 60 * 1000;

    // Guardar en storage
    chrome.storage.sync.set({ setupGuideCooldownUntil: cooldownUntil }, () => {
      showCooldownScreen(cooldownUntil);
      document.getElementById("requestScreen").style.display = "none";
    });
  } catch (error) {
    console.error("Error al activar timer:", error);
    // Fallback: usar hora local si la API falla
    const cooldownUntil = Date.now() + 1 * 60 * 1000;
    chrome.storage.sync.set({ setupGuideCooldownUntil: cooldownUntil }, () => {
      showCooldownScreen(cooldownUntil);
      document.getElementById("requestScreen").style.display = "none";
    });
  }
}

function initializeGuide() {
  const osSelector = document.getElementById("os-selector");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const doneBtn = document.getElementById("doneBtn");

  // Obtener el ID de la extensión
  const extensionId = chrome.runtime.id;

  // Detectar SO automáticamente
  const detectedOs = detectOS();
  osSelector.value = detectedOs.id;

  // Reemplazar todos los "tu_extension_id" con el ID real
  document.querySelectorAll(".code-block").forEach((block) => {
    block.innerHTML = block.innerHTML.replace(/tu_extension_id/g, extensionId);
  });

  // También reemplazar en los ejemplos
  document.querySelectorAll(".extension-id-example").forEach((el) => {
    el.textContent = extensionId;
  });

  // Manejar cambio de SO
  osSelector.addEventListener("change", () => {
    updateGuides(osSelector.value, getCurrentMode());
  });

  // Manejar cambio de modo (install/uninstall)
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;

      // Actualizar botones activos
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Actualizar guías
      updateGuides(osSelector.value, mode);

      // Mostrar/ocultar botón según modo
      if (mode === "install") {
        doneBtn.style.display = "inline-flex";
      } else {
        doneBtn.style.display = "none";
      }
    });
  });

  // Event listener para el botón "Ya lo he instalado"
  doneBtn.addEventListener("click", completeInstallation);

  // Mostrar la guía inicial (SO detectado + install)
  updateGuides(detectedOs.id, "install");
  doneBtn.style.display = "inline-flex"; // Mostrar el botón inicialmente
}

function showCooldownScreen(cooldownUntil) {
  // Ocultar contenido principal
  document.querySelector(".controls").style.display = "none";
  document.querySelectorAll(".guide-section").forEach((section) => {
    section.style.display = "none";
  });
  document.getElementById("requestScreen").style.display = "none";

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
      chrome.storage.sync.remove(["setupGuideCooldownUntil"], () => {
        window.close();
      });
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

function completeInstallation() {
  // Guardar que el usuario completó la guía
  chrome.storage.sync.set({ setupGuideCompleted: true }, () => {
    // El callback se ejecuta cuando se guarda correctamente
    console.log("setupGuideCompleted guardado");
    // Cerrar la ventana después de guardar
    setTimeout(() => {
      window.close();
    }, 500);
  });
}

function getCurrentMode() {
  const activeBtn = document.querySelector(".mode-btn.active");
  return activeBtn ? activeBtn.dataset.mode : "install";
}

function updateGuides(osId, mode) {
  document.querySelectorAll(".guide-section").forEach((section) => {
    section.style.display = "none";
  });

  const guideId = `guide-${osId}-${mode}`;
  const guideElement = document.getElementById(guideId);
  if (guideElement) {
    guideElement.style.display = "block";
  }
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
    return { name: "windows", id: "windows" };
  }
}
