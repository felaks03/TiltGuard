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

  obtenerTodos(): Observable<UsuariosResponse> {
    return this.http.get<UsuariosResponse>(this.apiUrl);
  }

  obtenerPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(
    usuario: Omit<Usuario, "_id" | "createdAt" | "updatedAt">,
  ): Observable<any> {
    return this.http.post<any>(this.apiUrl, usuario);
  }

  actualizar(id: string, usuario: Partial<Usuario>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, usuario);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
