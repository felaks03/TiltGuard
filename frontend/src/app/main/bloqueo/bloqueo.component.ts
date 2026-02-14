import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { BloqueoService } from "./bloqueo.service";

@Component({
  selector: "app-bloqueo",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./bloqueo.component.html",
  styleUrls: ["./bloqueo.component.scss"],
})
export class BloqueoComponent implements OnInit, OnDestroy {
  private blockingService = inject(BloqueoService);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Estado reactivo
  isBlocked = signal(false);
  blockUntil = signal<number | null>(null);
  selectedDuration = signal<string>("");
  isLoading = signal(false);
  showModal = signal(false);
  countdownText = signal("");
  errorMessage = signal("");

  // Computed
  canActivate = computed(
    () => !!this.selectedDuration() && !this.isBlocked() && !this.isLoading(),
  );

  confirmationMessage = computed(() => {
    const d = this.selectedDuration();
    const label = d === "day" ? "1 día" : d === "week" ? "1 semana" : "1 mes";
    return `Esto bloqueará Risk Settings por ${label}. ¿Deseas continuar?`;
  });

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  /** Carga el estado actual del bloqueo desde el backend */
  loadStatus(): void {
    this.isLoading.set(true);
    this.errorMessage.set("");

    this.blockingService.getStatus().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const { blockRiskSettings, blockUntil } = res.data;

        if (blockRiskSettings && blockUntil) {
          const until = new Date(blockUntil).getTime();
          const now = Date.now();

          if (now < until) {
            this.isBlocked.set(true);
            this.blockUntil.set(until);
            this.startCountdown(until);
          } else {
            // Expirado
            this.isBlocked.set(false);
            this.blockUntil.set(null);
          }
        } else {
          this.isBlocked.set(false);
          this.blockUntil.set(null);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set("Error al cargar el estado de bloqueo");
      },
    });
  }

  /** Muestra el modal de confirmación */
  requestActivation(): void {
    if (!this.selectedDuration()) return;
    this.showModal.set(true);
  }

  /** Confirma y activa el bloqueo */
  confirmActivation(): void {
    this.showModal.set(false);
    this.isLoading.set(true);
    this.errorMessage.set("");

    const duration = this.selectedDuration() as "day" | "week" | "month";

    this.blockingService.activate(duration).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const { blockRiskSettings, blockUntil } = res.data;

        if (blockRiskSettings && blockUntil) {
          const until = new Date(blockUntil).getTime();
          this.isBlocked.set(true);
          this.blockUntil.set(until);
          this.startCountdown(until);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.error || "Error al activar el bloqueo",
        );
      },
    });
  }

  /** Cancela el modal */
  cancelModal(): void {
    this.showModal.set(false);
  }

  /** Inicia el countdown */
  private startCountdown(until: number): void {
    this.clearCountdown();
    this.updateCountdown(until);
    this.countdownInterval = setInterval(() => {
      this.updateCountdown(until);
    }, 1000);
  }

  /** Actualiza el texto del countdown */
  private updateCountdown(until: number): void {
    const now = Date.now();
    const remaining = until - now;

    if (remaining <= 0) {
      this.countdownText.set("");
      this.isBlocked.set(false);
      this.blockUntil.set(null);
      this.selectedDuration.set("");
      this.clearCountdown();
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    this.countdownText.set(`${hours}h ${minutes}m ${seconds}s`);
  }

  /** Limpia el interval */
  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
