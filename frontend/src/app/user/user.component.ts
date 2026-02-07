import { Component, OnInit, inject } from "@angular/core";
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

  private userService = inject(UserService);

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
      },
      error: (err) => {
        console.error("❌ Error al cargar usuarios:", err);
        this.error = `Error al cargar los usuarios: ${err.message || err.status}`;
        this.cargando = false;
      },
    });
  }
}
