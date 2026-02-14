import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Usuario, UsuariosResponse } from "../userlist/userlist.service";

export interface UsuarioResponse {
  success: boolean;
  data: Usuario;
}

@Injectable({
  providedIn: "root",
})
export class UserEditService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:4000/api/usuarios";

  usersGetById(id: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  usersUpdate(
    id: string,
    usuario: Partial<Usuario>,
  ): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}`, usuario);
  }

  usersValidate(usuario: Partial<Usuario>): boolean {
    return !!usuario._id;
  }
}
