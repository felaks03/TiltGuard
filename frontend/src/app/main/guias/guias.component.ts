import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { GuiasService } from "./guias.service";

// Unified code blocks per OS - one block does all 3 things (extension + incognito + tradovate)
const CODE_BLOCKS: Record<string, string> = {
  // === WINDOWS INSTALL (all 3 in one) ===
  "windows-install":
    "# ========================================\n" +
    "# TiltGuard - Protección Completa Windows\n" +
    "# Ejecutar en PowerShell como Administrador\n" +
    "# ========================================\n" +
    "\n" +
    "# 1. Reemplaza con tu ID de extensión (chrome://extensions)\n" +
    '$ExtId = "TU_EXTENSION_ID"\n' +
    "\n" +
    "# --- Forzar extensión (inremovible) ---\n" +
    'New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist" -Force | Out-Null\n' +
    'New-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist" -Name "1" -Value "$ExtId;https://clients2.google.com/service/update2/crx" -PropertyType String -Force | Out-Null\n' +
    "\n" +
    "# --- Desactivar modo incógnito ---\n" +
    'New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome" -Force | Out-Null\n' +
    'New-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome" -Name "IncognitoModeAvailability" -Value 1 -PropertyType DWord -Force | Out-Null\n' +
    "\n" +
    "# --- Eliminar Tradovate del sistema ---\n" +
    'Stop-Process -Name "*Tradovate*" -Force -ErrorAction SilentlyContinue\n' +
    "$paths = @(\n" +
    '    "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",\n' +
    '    "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",\n' +
    '    "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"\n' +
    ")\n" +
    "foreach ($p in $paths) {\n" +
    "    Get-ItemProperty $p -EA SilentlyContinue |\n" +
    '        Where-Object { $_.DisplayName -like "*Tradovate*" } |\n' +
    "        ForEach-Object {\n" +
    '            if ($_.UninstallString) { cmd /c "$($_.UninstallString) /S" 2>$null }\n' +
    "        }\n" +
    "}\n" +
    '$folders = @("$env:USERPROFILE\\Downloads", "$env:USERPROFILE\\Desktop", "$env:TEMP")\n' +
    "foreach ($f in $folders) {\n" +
    '    Get-ChildItem -Path $f -Filter "*[Tt]radovate*" -Recurse -EA SilentlyContinue |\n' +
    "        Remove-Item -Force -Recurse -EA SilentlyContinue\n" +
    "}\n" +
    'Remove-Item "$env:LOCALAPPDATA\\Tradovate" -Recurse -Force -EA SilentlyContinue\n' +
    'Remove-Item "$env:APPDATA\\Tradovate" -Recurse -Force -EA SilentlyContinue\n' +
    'Remove-Item "$env:LOCALAPPDATA\\tradovate*" -Recurse -Force -EA SilentlyContinue\n' +
    "\n" +
    'Write-Host ""\n' +
    'Write-Host "=== Protección TiltGuard activada ===" -ForegroundColor Green\n' +
    'Write-Host "1. Extensión forzada (inremovible)"\n' +
    'Write-Host "2. Modo incógnito desactivado"\n' +
    'Write-Host "3. Tradovate eliminado del sistema"\n' +
    'Write-Host ""\n' +
    'Write-Host "Reinicia Chrome para aplicar los cambios."',

  // === WINDOWS UNINSTALL (all 3 in one) ===
  "windows-uninstall":
    "# ========================================\n" +
    "# TiltGuard - Desinstalar Protección Windows\n" +
    "# Ejecutar en PowerShell como Administrador\n" +
    "# ========================================\n" +
    "\n" +
    "# --- Desbloquear extensión ---\n" +
    'Remove-Item -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist" -Recurse -Force -ErrorAction SilentlyContinue\n' +
    "\n" +
    "# --- Reactivar modo incógnito ---\n" +
    'Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome" -Name "IncognitoModeAvailability" -Force -ErrorAction SilentlyContinue\n' +
    "\n" +
    'Write-Host ""\n' +
    'Write-Host "=== Protección TiltGuard desactivada ===" -ForegroundColor Yellow\n' +
    'Write-Host "1. Extensión desbloqueada"\n' +
    'Write-Host "2. Modo incógnito reactivado"\n' +
    'Write-Host "3. Tradovate se puede reinstalar desde tradovate.com/devices"\n' +
    'Write-Host ""\n' +
    'Write-Host "Reinicia Chrome para aplicar los cambios."',

  // === MAC INSTALL (all 3 in one) ===
  "mac-install":
    "# ========================================\n" +
    "# TiltGuard - Protección Completa macOS\n" +
    "# Pegar en Terminal\n" +
    "# ========================================\n" +
    "\n" +
    "# 1. Reemplaza con tu ID de extensión (chrome://extensions)\n" +
    'EXT_ID="TU_EXTENSION_ID"\n' +
    "\n" +
    "# --- Forzar extensión (inremovible) ---\n" +
    'sudo mkdir -p "/Library/Google/Chrome/policies/managed"\n' +
    'printf \'{"ExtensionInstallForcelist":["%s;https://clients2.google.com/service/update2/crx"]}\' "$EXT_ID" | sudo tee "/Library/Google/Chrome/policies/managed/force_extension.json" > /dev/null\n' +
    "\n" +
    "# --- Desactivar modo incógnito ---\n" +
    "defaults write com.google.Chrome IncognitoModeAvailability -integer 1\n" +
    "\n" +
    "# --- Eliminar Tradovate del sistema ---\n" +
    'killall "Tradovate" 2>/dev/null\n' +
    'sudo rm -rf "/Applications/Tradovate.app"\n' +
    "rm -rf ~/Applications/Tradovate.app\n" +
    'find ~/Downloads ~/Desktop /tmp -iname "*tradovate*" -delete 2>/dev/null\n' +
    "rm -rf ~/Library/Application\\ Support/Tradovate\n" +
    "rm -rf ~/Library/Application\\ Support/tradovate*\n" +
    "rm -rf ~/Library/Caches/Tradovate\n" +
    "rm -rf ~/Library/Preferences/com.tradovate*\n" +
    "\n" +
    'echo ""\n' +
    'echo "=== Protección TiltGuard activada ==="\n' +
    'echo "1. Extensión forzada (inremovible)"\n' +
    'echo "2. Modo incógnito desactivado"\n' +
    'echo "3. Tradovate eliminado del sistema"\n' +
    'echo ""\n' +
    'echo "Reinicia Chrome para aplicar los cambios."',

  // === MAC UNINSTALL (all 3 in one) ===
  "mac-uninstall":
    "# ========================================\n" +
    "# TiltGuard - Desinstalar Protección macOS\n" +
    "# Pegar en Terminal\n" +
    "# ========================================\n" +
    "\n" +
    "# --- Desbloquear extensión ---\n" +
    'sudo rm -f "/Library/Google/Chrome/policies/managed/force_extension.json"\n' +
    "\n" +
    "# --- Reactivar modo incógnito ---\n" +
    "defaults write com.google.Chrome IncognitoModeAvailability -integer 0\n" +
    "\n" +
    'echo ""\n' +
    'echo "=== Protección TiltGuard desactivada ==="\n' +
    'echo "1. Extensión desbloqueada"\n' +
    'echo "2. Modo incógnito reactivado"\n' +
    'echo "3. Tradovate se puede reinstalar desde tradovate.com/devices"\n' +
    'echo ""\n' +
    'echo "Reinicia Chrome para aplicar los cambios."',

  // === LINUX INSTALL (all 3 in one) ===
  "linux-install":
    "# ========================================\n" +
    "# TiltGuard - Protección Completa Linux\n" +
    "# Pegar en Terminal\n" +
    "# ========================================\n" +
    "\n" +
    "# 1. Reemplaza con tu ID de extensión (chrome://extensions)\n" +
    'EXT_ID="TU_EXTENSION_ID"\n' +
    "\n" +
    "# --- Forzar extensión (inremovible) ---\n" +
    "sudo mkdir -p /etc/opt/chrome/policies/managed\n" +
    'printf \'{"ExtensionInstallForcelist":["%s;https://clients2.google.com/service/update2/crx"]}\' "$EXT_ID" | sudo tee /etc/opt/chrome/policies/managed/force_extension.json > /dev/null\n' +
    "\n" +
    "# --- Desactivar modo incógnito ---\n" +
    "printf '{\"IncognitoModeAvailability\": 1}' | sudo tee /etc/opt/chrome/policies/managed/disable_incognito.json > /dev/null\n" +
    "\n" +
    "# --- Eliminar Tradovate del sistema ---\n" +
    "killall tradovate 2>/dev/null\n" +
    "sudo rm -rf /opt/Tradovate /opt/tradovate\n" +
    "rm -rf ~/.local/share/Tradovate\n" +
    "snap remove tradovate 2>/dev/null\n" +
    "flatpak uninstall com.tradovate.Tradovate -y 2>/dev/null\n" +
    'find ~/Downloads ~/Desktop /tmp -iname "*tradovate*" -delete 2>/dev/null\n' +
    "rm -rf ~/.config/Tradovate ~/.config/tradovate\n" +
    "rm -rf ~/.cache/Tradovate ~/.cache/tradovate\n" +
    "\n" +
    'echo ""\n' +
    'echo "=== Protección TiltGuard activada ==="\n' +
    'echo "1. Extensión forzada (inremovible)"\n' +
    'echo "2. Modo incógnito desactivado"\n' +
    'echo "3. Tradovate eliminado del sistema"\n' +
    'echo ""\n' +
    'echo "Reinicia Chrome para aplicar los cambios."',

  // === LINUX UNINSTALL (all 3 in one) ===
  "linux-uninstall":
    "# ========================================\n" +
    "# TiltGuard - Desinstalar Protección Linux\n" +
    "# Pegar en Terminal\n" +
    "# ========================================\n" +
    "\n" +
    "# --- Desbloquear extensión ---\n" +
    "sudo rm -f /etc/opt/chrome/policies/managed/force_extension.json\n" +
    "\n" +
    "# --- Reactivar modo incógnito ---\n" +
    "sudo rm -f /etc/opt/chrome/policies/managed/disable_incognito.json\n" +
    "\n" +
    'echo ""\n' +
    'echo "=== Protección TiltGuard desactivada ==="\n' +
    'echo "1. Extensión desbloqueada"\n' +
    'echo "2. Modo incógnito reactivado"\n' +
    'echo "3. Tradovate se puede reinstalar desde tradovate.com/devices"\n' +
    'echo ""\n' +
    'echo "Reinicia Chrome para aplicar los cambios."',
};

@Component({
  selector: "app-guias",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./guias.component.html",
  styleUrls: ["./guias.component.scss"],
})
export class GuiasComponent implements OnInit, OnDestroy {
  private guiasService = inject(GuiasService);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  // Estado
  isLoading = signal(false);
  errorMessage = signal("");
  setupCompleted = signal(false);
  cooldownUntil = signal<number | null>(null);
  accessUntil = signal<number | null>(null);
  cooldownText = signal("");
  accessText = signal("");

  // UI state
  showOverlay = signal(false);
  overlayMode = signal<"request" | "cooldown" | "none">("none");
  showConfirmModal = signal(false);
  confirmAction = signal<"install" | "uninstall">("install");

  // Guide controls
  mainType = signal<"install" | "uninstall">("install");
  detectedOS = signal("");
  detectedOSId = signal("");
  selectedOSId = signal("");
  extensionId = signal<string | null>(null);

  // Computed
  canUninstall = computed(() => this.setupCompleted());
  hasActiveAccess = computed(() => {
    const until = this.accessUntil();
    return until !== null && Date.now() < until;
  });
  hasCooldown = computed(() => {
    const until = this.cooldownUntil();
    return until !== null && Date.now() < until;
  });

  // All guide configurations
  guideConfigs = computed(() => {
    const os = this.selectedOSId() || this.detectedOSId();
    const mode = this.mainType();
    return {
      guideId: `${os}-${mode}`,
    };
  });

  // Selected OS display name
  selectedOSName = computed(() => {
    const id = this.selectedOSId() || this.detectedOSId();
    switch (id) {
      case "windows":
        return "Windows";
      case "mac":
        return "macOS";
      case "linux":
        return "Linux";
      default:
        return "";
    }
  });

  // Unified code block (all 3 actions in one) with extensionId injected
  codeBlock = computed(() => {
    let code = CODE_BLOCKS[this.guideConfigs().guideId] || "";
    const extId = this.extensionId();
    if (extId) {
      code = code.replace(/TU_EXTENSION_ID/g, extId);
    }
    return code;
  });

  ngOnInit(): void {
    this.detectOS();
    this.loadStatus();

    // Polling every 30s
    this.pollingInterval = setInterval(() => {
      this.loadStatus(true);
    }, 30000);
  }

  ngOnDestroy(): void {
    this.clearTimers();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  loadStatus(silent = false): void {
    if (!silent) this.isLoading.set(true);
    this.errorMessage.set("");

    this.guiasService.getStatus().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const { setupCompleted, cooldownUntil, accessUntil, extensionId } =
          res.data;

        this.setupCompleted.set(setupCompleted);
        if (extensionId) {
          this.extensionId.set(extensionId);
        }

        const now = Date.now();

        if (cooldownUntil) {
          const until = new Date(cooldownUntil).getTime();
          if (now < until) {
            this.cooldownUntil.set(until);
            this.accessUntil.set(null);
            this.showOverlay.set(true);
            this.overlayMode.set("cooldown");
            this.startCooldownTimer(until);
          } else {
            this.cooldownUntil.set(null);
          }
        } else {
          this.cooldownUntil.set(null);
        }

        if (accessUntil) {
          const until = new Date(accessUntil).getTime();
          if (now < until) {
            this.accessUntil.set(until);
            this.cooldownUntil.set(null);
            this.showOverlay.set(false);
            this.overlayMode.set("none");
            this.startAccessTimer(until);
          } else {
            this.accessUntil.set(null);
          }
        } else if (
          !cooldownUntil ||
          (cooldownUntil && new Date(cooldownUntil).getTime() <= now)
        ) {
          this.accessUntil.set(null);
        }

        // If setup completed and no active access and no cooldown: show request overlay
        if (setupCompleted && !this.hasActiveAccess() && !this.hasCooldown()) {
          this.showOverlay.set(true);
          this.overlayMode.set("request");
        } else if (!setupCompleted) {
          this.showOverlay.set(false);
          this.overlayMode.set("none");
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 0) {
          this.errorMessage.set(
            "No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.",
          );
        } else if (err.status === 401) {
          this.errorMessage.set(
            "Sesión expirada. Por favor, vuelve a iniciar sesión.",
          );
        } else {
          this.errorMessage.set(
            err.error?.error || "Error al cargar el estado de las guías",
          );
        }
      },
    });
  }

  retryLoad(): void {
    this.errorMessage.set("");
    this.loadStatus();
  }

  requestAccess(): void {
    this.isLoading.set(true);
    this.guiasService.requestAccess().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const { cooldownUntil } = res.data;

        if (cooldownUntil) {
          const until = new Date(cooldownUntil).getTime();
          this.cooldownUntil.set(until);
          this.accessUntil.set(null);
          this.overlayMode.set("cooldown");
          this.startCooldownTimer(until);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set("Error al solicitar acceso");
      },
    });
  }

  setMainType(type: "install" | "uninstall"): void {
    this.mainType.set(type);
  }

  selectOS(osId: string): void {
    this.selectedOSId.set(osId);
  }

  openConfirmModal(action: "install" | "uninstall"): void {
    this.confirmAction.set(action);
    this.showConfirmModal.set(true);
  }

  cancelConfirmModal(): void {
    this.showConfirmModal.set(false);
  }

  confirmSetup(): void {
    this.showConfirmModal.set(false);
    this.errorMessage.set("");
    const action = this.confirmAction();

    if (action === "install") {
      this.isLoading.set(true);
      this.guiasService.completeSetup().subscribe({
        next: () => {
          this.isLoading.set(false);
          this.setupCompleted.set(true);
          this.showOverlay.set(true);
          this.overlayMode.set("request");
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 0) {
            this.errorMessage.set(
              "No se pudo conectar con el servidor. Inténtalo de nuevo.",
            );
          } else {
            this.errorMessage.set(
              err.error?.error || "Error al completar el setup",
            );
          }
        },
      });
    } else {
      this.isLoading.set(true);
      this.guiasService.undoSetup().subscribe({
        next: () => {
          this.isLoading.set(false);
          this.setupCompleted.set(false);
          this.showOverlay.set(false);
          this.overlayMode.set("none");
          this.cooldownUntil.set(null);
          this.accessUntil.set(null);
          this.clearTimers();
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 0) {
            this.errorMessage.set(
              "No se pudo conectar con el servidor. Inténtalo de nuevo.",
            );
          } else {
            this.errorMessage.set(
              err.error?.error || "Error al deshacer el setup",
            );
          }
        },
      });
    }
  }

  // Timer helpers
  private startCooldownTimer(until: number): void {
    this.clearTimers();
    this.updateCooldownDisplay(until);
    this.countdownInterval = setInterval(() => {
      this.updateCooldownDisplay(until);
    }, 1000);
  }

  private updateCooldownDisplay(until: number): void {
    const now = Date.now();
    const remaining = until - now;

    if (remaining <= 0) {
      this.cooldownText.set("");
      this.cooldownUntil.set(null);
      this.clearTimers();
      // Reload status to get the new access period
      this.loadStatus();
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    this.cooldownText.set(
      `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`,
    );
  }

  private startAccessTimer(until: number): void {
    this.clearTimers();
    this.updateAccessDisplay(until);
    this.countdownInterval = setInterval(() => {
      this.updateAccessDisplay(until);
    }, 1000);
  }

  private updateAccessDisplay(until: number): void {
    const now = Date.now();
    const remaining = until - now;

    if (remaining <= 0) {
      this.accessText.set("");
      this.accessUntil.set(null);
      this.clearTimers();
      this.showOverlay.set(true);
      this.overlayMode.set("request");
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    this.accessText.set(
      `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`,
    );
  }

  private clearTimers(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // OS detection
  private detectOS(): void {
    const ua = navigator.userAgent;

    if (ua.indexOf("Win") > -1) {
      this.detectedOS.set("Windows");
      this.detectedOSId.set("windows");
    } else if (ua.indexOf("Mac") > -1) {
      this.detectedOS.set("macOS");
      this.detectedOSId.set("mac");
    } else {
      this.detectedOS.set("Linux");
      this.detectedOSId.set("linux");
    }
  }
}
