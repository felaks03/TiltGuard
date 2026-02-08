import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { signal } from "@angular/core";
import { AdminDashboardService } from "./admin-dashboard.service";
import { Usuario } from "../userlist/userlist.service";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.scss"],
})
export class AdminDashboardComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  totalUsuarios = signal<number>(0);
  usuariosActivos = signal<number>(0);
  usuariosInactivos = signal<number>(0);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  private adminDashboardService = inject(AdminDashboardService);

  ngOnInit(): void {
    this.statsLoad();
  }

  statsLoad(): void {
    this.adminDashboardService.usersGetAll().subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.usuarios.set(response.data);
          const stats = this.adminDashboardService.statsCalculate(
            response.data,
          );
          this.totalUsuarios.set(stats.total);
          this.usuariosActivos.set(stats.activos);
          this.usuariosInactivos.set(stats.inactivos);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          `Error al cargar estadísticas: ${err.message || "Error desconocido"}`,
        );
        this.loading.set(false);
      },
    });
  }
}
