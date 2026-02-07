import { Component, OnInit } from "@angular/core";
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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;
    this.userService.obtenerTodos().subscribe({
      next: (response) => {
        this.usuarios = response.data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = "Error al cargar los usuarios";
        console.error(err);
        this.cargando = false;
      },
    });
  }
}
