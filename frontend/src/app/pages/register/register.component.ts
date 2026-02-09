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
 * RegisterComponent - Página de registro
 *
 * Responsabilidades:
 * - Mostrar formulario de registro (nombre, email, password, confirmación)
 * - Validar que las contraseñas coincidan
 * - Validar longitud de caracteres
 * - Llamar a AuthService.register()
 * - Redirigir a /login después
 */
@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Crea el formulario reactivo con validadores
   * Incluye validador personalizado para coincidencia de contraseñas
   */
  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        // Nombre: requerido, mínimo 2 caracteres
        nombre: ["", [Validators.required, Validators.minLength(2)]],
        // Email: requerido y válido
        email: ["", [Validators.required, Validators.email]],
        // Password: requerido, mínimo 6 caracteres
        password: ["", [Validators.required, Validators.minLength(6)]],
        // Confirmación de contraseña: requerida
        passwordConfirm: ["", [Validators.required]],
      },
      // Validador de grupo para verificar que las contraseñas coincidan
      { validators: this.passwordMatchValidator },
    );
  }

  /**
   * Validador personalizado que verifica si las contraseñas coinciden
   * Se aplica al FormGroup, no a un campo individual
   */
  private passwordMatchValidator(
    group: FormGroup,
  ): { [key: string]: any } | null {
    const password = group.get("password")?.value;
    const passwordConfirm = group.get("passwordConfirm")?.value;

    // Si las contraseñas coinciden, retorna null (válido)
    // Si no coinciden, retorna error
    return password === passwordConfirm ? null : { passwordMismatch: true };
  }

  /**
   * Se ejecuta al hacer submit del formulario
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Solo necesitamos nombre, email y password (no passwordConfirm)
    const { nombre, email, password } = this.registerForm.value;

    // Llama al AuthService para registrar
    this.authService.register(nombre, email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = "¡Registro exitoso! Redirigiendo a login...";

        // Espera 1.5 segundos y redirige a /login
        setTimeout(() => {
          this.router.navigate(["/login"]);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.error || "Error en el registro. Intenta de nuevo.";
      },
    });
  }

  /**
   * Verifica si un campo tiene un error específico
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(
      field &&
      field.hasError(errorType) &&
      (field.dirty || field.touched)
    );
  }

  /**
   * Verifica específicamente si las contraseñas no coinciden
   */
  passwordMismatch(): boolean {
    return !!(
      this.registerForm.hasError("passwordMismatch") &&
      this.registerForm.get("passwordConfirm")?.touched
    );
  }
}
