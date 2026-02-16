import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface GuideAccessStatus {
  success: boolean;
  data: {
    setupCompleted: boolean;
    cooldownUntil: string | null;
    accessUntil: string | null;
    extensionId: string | null;
  };
}

@Injectable({
  providedIn: "root",
})
export class GuiasService {
  private apiUrl = "http://localhost:4000/api/guide-access";
  private http = inject(HttpClient);

  /**
   * Obtiene el estado actual de acceso a guías
   */
  getStatus(): Observable<GuideAccessStatus> {
    return this.http.get<GuideAccessStatus>(`${this.apiUrl}/status`);
  }

  /**
   * Marca el setup como completado
   */
  completeSetup(): Observable<GuideAccessStatus> {
    return this.http.post<GuideAccessStatus>(
      `${this.apiUrl}/complete-setup`,
      {},
    );
  }

  /**
   * Solicita acceso (inicia cooldown de 2h)
   */
  requestAccess(): Observable<GuideAccessStatus> {
    return this.http.post<GuideAccessStatus>(
      `${this.apiUrl}/request-access`,
      {},
    );
  }

  /**
   * Deshace el setup (desinstalación)
   */
  undoSetup(): Observable<GuideAccessStatus> {
    return this.http.post<GuideAccessStatus>(`${this.apiUrl}/undo-setup`, {});
  }
}
