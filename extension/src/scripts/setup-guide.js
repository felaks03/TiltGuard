document.addEventListener("DOMContentLoaded", () => {
  // Verificar si el usuario ya completó la guía
  chrome.storage.sync.get(["setupGuideCompleted", "accessUntil"], (result) => {
    if (result.setupGuideCompleted) {
      // Si ya completó, mostrar la guía pero con bloqueo
      initializeGuide();

      // Verificar si hay un timer activo
      if (result.accessUntil) {
        const now = Date.now();
        if (now < result.accessUntil) {
          // Timer aún activo, mostrar el timer
          showAccessBlockOverlay();
          showAccessTimer(
            result.accessUntil,
            document.getElementById("accessBlockContent"),
          );
          return;
        } else {
          // Timer expiró, limpiar y permitir acceso
          chrome.storage.sync.remove(["accessUntil"]);
          return;
        }
      }

      // No hay timer activo, mostrar overlay bloqueante normal
      showAccessBlockOverlay();
      return;
    }

    // Proceder normalmente si es la primera vez
    initializeGuide();
  });
});

function showAccessBlockOverlay() {
  const overlay = document.getElementById("accessBlockOverlay");
  overlay.style.display = "flex";

  const requestBtn = document.getElementById("requestAccessBtn");
  const blockContent = document.getElementById("accessBlockContent");

  requestBtn.addEventListener("click", async () => {
    try {
      // Obtener tiempo actual de la API
      const response = await fetch(
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
      );
      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      const currentTime = new Date(data.datetime).getTime();

      // Calcular tiempo de espera: 15 segundos desde ahora
      const accessUntil = currentTime + 15 * 1000;

      showAccessTimer(accessUntil, blockContent);
    } catch (error) {
      console.error("Error al solicitar acceso:", error);
      // Fallback: usar hora local si la API falla
      const accessUntil = Date.now() + 15 * 1000;
      showAccessTimer(accessUntil, blockContent);
    }
  });
}

function showAccessTimer(accessUntil, blockContent) {
  // Guardar el timestamp en storage para persistencia
  chrome.storage.sync.set({ accessUntil: accessUntil });

  // Cambiar contenido del bloqueo a timer
  blockContent.innerHTML = `
    <h2>⏱️ Esperando acceso...</h2>
    <p>Tu acceso estará disponible en:</p>
    <div class="access-timer">
      <strong id="accessTime">0:15</strong>
    </div>
  `;

  function updateAccessDisplay() {
    const now = Date.now();
    const remaining = accessUntil - now;

    if (remaining <= 0) {
      // Acceso otorgado, cerrar overlay y limpiar storage
      document.getElementById("accessBlockOverlay").style.display = "none";
      chrome.storage.sync.remove(["accessUntil"]);
      return;
    }

    // Calcular minutos y segundos
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const timeString = `${minutes}:${String(seconds).padStart(2, "0")}`;
    const accessTimeEl = document.getElementById("accessTime");
    if (accessTimeEl) {
      accessTimeEl.textContent = timeString;
    }
  }

  // Actualizar cada segundo
  updateAccessDisplay();
  setInterval(updateAccessDisplay, 1000);
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
