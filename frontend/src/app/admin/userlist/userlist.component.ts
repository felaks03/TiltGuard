import { Component, inject, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { signal } from "@angular/core";
import { UserlistService, Usuario } from "./userlist.service";

@Component({
  selector: "app-userlist",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./userlist.component.html",
  styleUrls: ["./userlist.component.scss"],
})
export class UserlistComponent {
  usuarios = signal<Usuario[]>([]);
  error = signal<string | null>(null);
  menuAbiertoId = signal<string | null>(null);

  private userService = inject(UserlistService);

  constructor() {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    console.log("📡 Iniciando carga de usuarios...");
    this.error.set(null);
    this.userService.obtenerTodos().subscribe({
      next: (response) => {
        console.log("✅ Usuarios cargados:", response);
        this.usuarios.set(response.data);
      },
      error: (err) => {
        console.error("❌ Error al cargar usuarios:", err);
        this.error.set(
          `Error al cargar los usuarios: ${err.message || err.status}`,
        );
      },
    });
  }

  toggleMenu(usuarioId: string, event: Event): void {
    event.stopPropagation();
    const currentId = this.menuAbiertoId();
    this.menuAbiertoId.set(currentId === usuarioId ? null : usuarioId);
  }

  cerrarMenu(): void {
    this.menuAbiertoId.set(null);
  }

  editar(usuario: Usuario): void {
    console.log("Editar usuario:", usuario);
    this.cerrarMenu();
    // Implementar lógica de edición
  }

  eliminar(usuario: Usuario): void {
    console.log("Eliminar usuario:", usuario);
    this.cerrarMenu();
    // Implementar lógica de eliminación
  }

  cambiarEstado(usuario: Usuario): void {
    console.log("Cambiar estado usuario:", usuario);
    this.cerrarMenu();
    // Implementar lógica de cambio de estado
  }
}
