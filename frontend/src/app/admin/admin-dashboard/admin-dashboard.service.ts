import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { UsuariosResponse } from "../userlist/userlist.service";

@Injectable({
  providedIn: "root",
})
export class AdminDashboardService {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:5000/api/usuarios";

  usersGetAll(): Observable<UsuariosResponse> {
    return this.http.get<UsuariosResponse>(this.apiUrl);
  }

  statsCalculate(usuarios: any[]) {
    return {
      total: usuarios.length,
      activos: usuarios.filter((u) => u.activo).length,
      inactivos: usuarios.filter((u) => !u.activo).length,
    };
  }
}
