// Función para bloquear el elemento Risk Settings
function blockRiskSettings() {
  // Buscar el contenedor específico por su estructura exacta
  const containers = document.querySelectorAll(
    ".MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-2.MuiGrid-item.MuiGrid-grid-xs-12",
  );

  containers.forEach((container) => {
    // Verificar si contiene el botón "Risk Settings"
    const button = container.querySelector("button");
    if (button && button.textContent.includes("Risk Settings")) {
      container.style.display = "none";
      container.setAttribute("data-tiltguard-blocked", "true");
      console.log("Risk Settings bloqueado");
    }
  });
}

// Bloquear al cargar la página
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", blockRiskSettings);
} else {
  blockRiskSettings();
}

// Observar cambios en el DOM y reaplicar bloqueo si es necesario
const observer = new MutationObserver(() => {
  // Solo ejecutar bloqueo si no está ya bloqueado
  const alreadyBlocked = document.querySelector(
    "[data-tiltguard-blocked=true]",
  );
  if (!alreadyBlocked) {
    blockRiskSettings();
  }
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
