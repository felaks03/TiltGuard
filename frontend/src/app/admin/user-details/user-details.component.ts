import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule, Router } from "@angular/router";
import { signal } from "@angular/core";
import { UserlistService, Usuario } from "../userlist/userlist.service";

@Component({
  selector: "app-user-details",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./user-details.component.html",
  styleUrls: ["./user-details.component.scss"],
})
export class UserDetailsComponent implements OnInit {
  usuario = signal<Usuario | null>(null);
  error = signal<string | null>(null);
  loading = signal<boolean>(true);

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

  volver(): void {
    this.router.navigate(["/admin/user-list"]);
  }

  editarUsuario(): void {
    const id = this.usuario()?._id;
    if (id) {
      this.router.navigate(["/admin/user-edit", id]);
    }
  }
}
