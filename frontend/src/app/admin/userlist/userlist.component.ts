import { Component, inject, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { signal } from "@angular/core";
import { UserlistService, Usuario } from "./userlist.service";

@Component({
  selector: "app-userlist",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./userlist.component.html",
  styleUrls: ["./userlist.component.scss"],
})
export class UserlistComponent {
  usuarios = signal<Usuario[]>([]);
  error = signal<string | null>(null);
  menuAbiertoId = signal<string | null>(null);
  sidebarAbierta = signal<boolean>(false);
  creandoUsuario = signal<boolean>(false);
  nuevoUsuario = signal<Partial<Usuario>>({
    nombre: "",
    email: "",
    password: "",
    rol: "usuario",
    activo: true,
    telefono: "",
    ciudad: "",
    pais: "",
  });

  private userService = inject(UserlistService);
  private router = inject(Router);

  constructor() {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.error.set(null);
    this.userService.obtenerTodos().subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.usuarios.set(response.data);
        } else {
          this.error.set("Formato de respuesta inválido del servidor");
        }
      },
      error: (err) => {
        this.error.set(
          `Error al cargar los usuarios: ${err.message || err.statusText || "Error desconocido"}`,
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

  verDetalles(usuario: Usuario): void {
    this.cerrarMenu();
    this.router.navigate(["/admin/user-details", usuario._id]);
  }

  editar(usuario: Usuario): void {
    this.cerrarMenu();
    this.router.navigate(["/admin/user-edit", usuario._id]);
  }

  eliminar(usuario: Usuario): void {
    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
    );

    if (confirmacion) {
      this.cerrarMenu();
      this.userService.eliminar(usuario._id).subscribe({
        next: () => {
          this.cargarUsuarios();
        },
        error: (err) => {
          this.error.set(`Error al eliminar usuario: ${err.message}`);
        },
      });
    } else {
      this.cerrarMenu();
    }
  }

  cambiarEstado(usuario: Usuario): void {
    this.cerrarMenu();
    // Implementar lógica de cambio de estado
  }

  abrirSidebar(): void {
    this.sidebarAbierta.set(true);
    this.nuevoUsuario.set({
      nombre: "",
      email: "",
      password: "",
      rol: "usuario",
      activo: true,
      telefono: "",
      ciudad: "",
      pais: "",
    });
  }

  cerrarSidebar(): void {
    this.sidebarAbierta.set(false);
  }

  crearUsuario(): void {
    const usuario = this.nuevoUsuario();

    if (!usuario.nombre || !usuario.email || !usuario.password) {
      alert(
        "Por favor completa los campos obligatorios: nombre, email y contraseña",
      );
      return;
    }

    this.creandoUsuario.set(true);
    this.userService
      .crear(usuario as Omit<Usuario, "_id" | "createdAt" | "updatedAt">)
      .subscribe({
        next: () => {
          this.creandoUsuario.set(false);
          this.cerrarSidebar();
          this.cargarUsuarios();
        },
        error: (err) => {
          const errorMessage =
            err.error?.error || err.message || "Error desconocido";
          this.creandoUsuario.set(false);
          alert(`Error al crear usuario: ${errorMessage}`);
        },
      });
  }
}
