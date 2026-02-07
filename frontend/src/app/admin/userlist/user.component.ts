import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserService, Usuario } from "./user.service";

@Component({
  selector: "app-user",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./user.component.html",
  styleUrls: ["./user.component.scss"],
})
export class UserComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargando = false;
  error: string | null = null;
  menuAbiertoId: string | null = null;

  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    console.log("✅ UserComponent inicializado");
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    console.log("📡 Iniciando carga de usuarios...");
    this.cargando = true;
    this.error = null;
    this.userService.obtenerTodos().subscribe({
      next: (response) => {
        console.log("✅ Usuarios cargados:", response);
        this.usuarios = response.data;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("❌ Error al cargar usuarios:", err);
        this.error = `Error al cargar los usuarios: ${err.message || err.status}`;
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleMenu(usuarioId: string, event: Event): void {
    event.stopPropagation();
    this.menuAbiertoId = this.menuAbiertoId === usuarioId ? null : usuarioId;
  }

  cerrarMenu(): void {
    this.menuAbiertoId = null;
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
