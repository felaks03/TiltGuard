import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  password?: string;
  rol: "usuario" | "admin";
  activo: boolean;
  avatar?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsuariosResponse {
  success: boolean;
  count: number;
  data: Usuario[];
}

@Injectable({
  providedIn: "root",
})
export class UserlistService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:5000/api/usuarios";

  usersGetAll(): Observable<UsuariosResponse> {
    return this.http.get<UsuariosResponse>(this.apiUrl);
  }

  usersGetById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  usersCreate(
    usuario: Omit<Usuario, "_id" | "createdAt" | "updatedAt">,
  ): Observable<any> {
    return this.http.post<any>(this.apiUrl, usuario);
  }

  usersUpdate(id: string, usuario: Partial<Usuario>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, usuario);
  }

  usersDelete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  usersValidate(usuario: Partial<Usuario>): {
    valido: boolean;
    mensaje?: string;
  } {
    if (!usuario.nombre || !usuario.email || !usuario.password) {
      return {
        valido: false,
        mensaje:
          "Por favor completa los campos obligatorios: nombre, email y contraseña",
      };
    }
    return { valido: true };
  }

  /**
   * Suplanta a un usuario (solo para admins)
   * POST /api/auth/impersonate/:userId
   */
  impersonate(userId: string): Observable<any> {
    const authApiUrl = "http://localhost:5000/api/auth";
    return this.http.post(`${authApiUrl}/impersonate/${userId}`, {});
  }

  /**
   * Detiene la suplantación y vuelve a la sesión del admin original
   * POST /api/auth/stop-impersonation
   */
  stopImpersonation(): Observable<any> {
    const authApiUrl = "http://localhost:5000/api/auth";
    return this.http.post(`${authApiUrl}/stop-impersonation`, {});
  }
}
