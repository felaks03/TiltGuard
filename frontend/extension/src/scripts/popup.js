document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleBlockBtn");
  const statusElement = document.getElementById("status");
  const countdownElement = document.getElementById("countdown");
  const durationSelect = document.getElementById("blockDuration");
  const link1 = document.getElementById("link1");
  const advancedSetupBtn = document.getElementById("advancedSetupBtn");
  const helpBtn = document.getElementById("helpBtn");

  // Elementos de la modal
  const confirmationModal = document.getElementById("confirmationModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  let pendingAction = null;

  // Función para abrir la modal
  function showConfirmationModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmationModal.classList.add("active");
    pendingAction = onConfirm;
  }

  // Función para cerrar la modal
  function closeConfirmationModal() {
    confirmationModal.classList.remove("active");
    pendingAction = null;
  }

  // Manejar clic en Protección Avanzada
  advancedSetupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const guideUrl = chrome.runtime.getURL("src/pages/setup-guide.html");
    chrome.tabs.create({ url: guideUrl });
  });

  // Manejar clic en el botón de ayuda
  helpBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const settingsGuideUrl = chrome.runtime.getURL(
      "src/pages/settings-guide.html",
    );
    chrome.tabs.create({ url: settingsGuideUrl });
  });

  // Manejar clicks en el link
  link1.addEventListener("click", () => {
    chrome.tabs.update({ url: "https://trader.tradovate.com" });
  });

  // Manejar cambio de duración
  durationSelect.addEventListener("change", () => {
    toggleBtn.disabled = !durationSelect.value;
  });

  // Cargar estado de Risk Settings
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
        // El bloqueo ha expirado
        chrome.storage.sync.set({ blockRiskSettings: false, blockUntil: null });
        updateBlockUI(false);
        durationSelect.disabled = false;
      }
    } else {
      updateBlockUI(isBlocked);
      durationSelect.disabled = false;
    }
  });

  // Click en el botón de Risk Settings
  toggleBtn.addEventListener("click", async () => {
    const duration = durationSelect.value;
    if (!duration) return;

    showConfirmationModal(
      "¿Bloquear Risk Settings?",
      `Esto bloqueará Risk Settings por ${duration === "day" ? "1 día" : duration === "week" ? "1 semana" : "1 mes"}. ¿Deseas continuar?`,
      async () => {
        try {
          const blockUntil = await calculateBlockUntil(duration);

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
                      .catch(() => {
                        // Tab not ready
                      });
                    // Recargar la pestaña
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
          alert("Error al calcular la fecha de bloqueo");
          closeConfirmationModal();
        }
      },
    );
  });

  // Botones de la modal
  modalCancelBtn.addEventListener("click", closeConfirmationModal);

  modalConfirmBtn.addEventListener("click", () => {
    if (pendingAction) {
      pendingAction();
    }
  });

  // Cerrar modal si se hace clic fuera
  confirmationModal.addEventListener("click", (e) => {
    if (e.target === confirmationModal) {
      closeConfirmationModal();
    }
  });

  async function calculateBlockUntil(duration) {
    try {
      const response = await fetch(
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
      );
      const data = await response.json();
      const nowDate = new Date(data.datetime);
      let blockUntilDate = new Date(nowDate);

      if (duration === "day") {
        // Medianoche del mismo día
        blockUntilDate.setHours(23, 59, 59, 999);
      } else if (duration === "week") {
        // Domingo a medianoche
        const dayOfWeek = blockUntilDate.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
        blockUntilDate.setDate(blockUntilDate.getDate() + daysUntilSunday);
        blockUntilDate.setHours(23, 59, 59, 999);
      } else if (duration === "month") {
        // Último día del mes a medianoche
        blockUntilDate = new Date(
          blockUntilDate.getFullYear(),
          blockUntilDate.getMonth() + 1,
          0,
        );
        blockUntilDate.setHours(23, 59, 59, 999);
      }

      return blockUntilDate.getTime();
    } catch (error) {
      // Fallback: usar hora local si la API falla
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

  function startCountdown(blockUntil) {
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
    setInterval(updateCountdown, 1000);
  }

  function updateBlockUI(isBlocked, blockUntil = null) {
    if (isBlocked) {
      toggleBtn.textContent = "Desbloqueado";
      toggleBtn.classList.add("blocked");
      statusElement.textContent = "Estado: Bloqueado ✓";
    } else {
      toggleBtn.textContent = "Bloquear Risk Settings";
      toggleBtn.classList.remove("blocked");
      statusElement.textContent = "Estado: Desbloqueado ✗";
      countdownElement.textContent = "";
    }
  }

  function resetUI() {
    updateBlockUI(false);
    durationSelect.value = "";
    durationSelect.disabled = false;
    toggleBtn.disabled = true;
    countdownElement.textContent = "";
  }
});
