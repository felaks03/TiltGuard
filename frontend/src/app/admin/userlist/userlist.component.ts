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
  mostrarModalEliminar = signal<boolean>(false);
  usuarioAEliminar = signal<Usuario | null>(null);
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
    this.usersLoad();
  }

  usersLoad(): void {
    this.error.set(null);
    this.userService.usersGetAll().subscribe({
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

  menuToggle(usuarioId: string, event: Event): void {
    event.stopPropagation();
    const currentId = this.menuAbiertoId();
    this.menuAbiertoId.set(currentId === usuarioId ? null : usuarioId);
  }

  menuClose(): void {
    this.menuAbiertoId.set(null);
  }

  usersViewDetails(usuario: Usuario): void {
    this.menuClose();
    this.router.navigate(["/admin/user-details", usuario._id]);
  }

  usersNavigateEdit(usuario: Usuario): void {
    this.menuClose();
    this.router.navigate(["/admin/user-edit", usuario._id]);
  }

  usersDeleteStart(usuario: Usuario): void {
    this.usuarioAEliminar.set(usuario);
    this.mostrarModalEliminar.set(true);
    this.menuClose();
  }

  usersDeleteCancel(): void {
    this.mostrarModalEliminar.set(false);
    this.usuarioAEliminar.set(null);
  }

  usersDeleteConfirm(): void {
    const usuario = this.usuarioAEliminar();
    if (!usuario) return;

    this.userService.usersDelete(usuario._id).subscribe({
      next: () => {
        this.mostrarModalEliminar.set(false);
        this.usuarioAEliminar.set(null);
        this.usersLoad();
      },
      error: (err) => {
        this.error.set(`Error al eliminar usuario: ${err.message}`);
        this.mostrarModalEliminar.set(false);
        this.usuarioAEliminar.set(null);
      },
    });
  }

  usersChangeStatus(usuario: Usuario): void {
    this.menuClose();
    // Implementar lógica de cambio de estado
  }

  sidebarOpen(): void {
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

  sidebarClose(): void {
    this.sidebarAbierta.set(false);
  }

  usersCreate(): void {
    const usuario = this.nuevoUsuario();

    const validacion = this.userService.usersValidate(usuario);
    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }

    this.creandoUsuario.set(true);
    this.userService
      .usersCreate(usuario as Omit<Usuario, "_id" | "createdAt" | "updatedAt">)
      .subscribe({
        next: () => {
          this.creandoUsuario.set(false);
          this.sidebarClose();
          this.usersLoad();
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
