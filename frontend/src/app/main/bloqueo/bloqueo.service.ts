import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface BlockingStatus {
  success: boolean;
  data: {
    blockRiskSettings: boolean;
    blockUntil: string | null;
  };
}

@Injectable({
  providedIn: "root",
})
export class BloqueoService {
  private apiUrl = "http://localhost:3000/api/blocking";
  private http = inject(HttpClient);

  /**
   * Obtiene el estado actual de bloqueo del usuario
   */
  getStatus(): Observable<BlockingStatus> {
    return this.http.get<BlockingStatus>(`${this.apiUrl}/status`);
  }

  /**
   * Activa el bloqueo de Risk Settings por la duración especificada
   */
  activate(duration: "day" | "week" | "month"): Observable<BlockingStatus> {
    return this.http.post<BlockingStatus>(`${this.apiUrl}/activate`, {
      duration,
    });
  }
}
