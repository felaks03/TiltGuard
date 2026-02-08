import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule, Router } from "@angular/router";
import { signal } from "@angular/core";
import { UserlistService, Usuario } from "../userlist/userlist.service";

@Component({
  selector: "app-user-edit",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./user-edit.component.html",
  styleUrls: ["./user-edit.component.scss"],
})
export class UserEditComponent implements OnInit {
  usuario = signal<Partial<Usuario> | null>(null);
  error = signal<string | null>(null);
  loading = signal<boolean>(true);
  guardando = signal<boolean>(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserlistService);

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("ID de usuario no encontrado");
      this.loading.set(false);
      return;
    }

    this.userService.obtenerPorId(id).subscribe({
      next: (response) => {
        this.usuario.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(`Error al cargar el usuario: ${err.message}`);
        this.loading.set(false);
      },
    });
  }

  guardarCambios(): void {
    const usuarioActual = this.usuario();
    if (!usuarioActual || !usuarioActual._id) {
      this.error.set("Error: Usuario no válido");
      return;
    }

    this.guardando.set(true);
    this.userService.actualizar(usuarioActual._id, usuarioActual).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(["/admin/user-list"]);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(`Error al guardar los cambios: ${err.message}`);
      },
    });
  }

  volver(): void {
    this.router.navigate(["/admin/user-list"]);
  }
}
