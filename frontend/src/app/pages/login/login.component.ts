import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../services/auth.service";

/**
 * LoginComponent - Página de inicio de sesión
 *
 * Responsabilidades:
 * - Mostrar formulario de login (email, password)
 * - Validar datos
 * - Llamar a AuthService.login()
 * - Redirigir según rol
 */
@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup; // Formulario reactivo
  isLoading = false; // Flag para mostrar spinner
  errorMessage: string | null = null; // Mensaje de error

  constructor(
    private fb: FormBuilder, // Para construir formularios
    private authService: AuthService, // Para hacer login
    private router: Router, // Para redirigir
  ) {}

  ngOnInit(): void {
    // Inicializa el formulario cuando carga el componente
    this.initializeForm();
  }

  /**
   * Crea el formulario reactivo con validadores
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      // Email: requerido y debe ser válido
      email: ["", [Validators.required, Validators.email]],
      // Password: requerido y mínimo 6 caracteres
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Se ejecuta al hacer submit del formulario
   */
  onSubmit(): void {
    // Si el formulario no es válido, no hace nada
    if (this.loginForm.invalid) {
      return;
    }

    // Muestra spinner
    this.isLoading = true;
    this.errorMessage = null;

    // Extrae los valores del formulario
    const { email, password } = this.loginForm.value;

    // Llama al AuthService para hacer login
    this.authService.login(email, password).subscribe({
      next: (response) => {
        // Login exitoso
        this.isLoading = false;
        const user = response.user;

        // Redirige según el rol del usuario
        if (user.rol === "admin") {
          this.router.navigate(["/admin/user-list"]);
        } else {
          this.router.navigate(["/user"]);
        }
      },
      error: (error) => {
        // Login fallido
        this.isLoading = false;
        this.errorMessage =
          error.error?.error || "Email o contraseña incorrectos";
      },
    });
  }

  /**
   * Verifica si un campo tiene un error específico
   * Usado para mostrar mensajes de error en el template
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(
      field &&
      field.hasError(errorType) &&
      (field.dirty || field.touched)
    );
  }
}
