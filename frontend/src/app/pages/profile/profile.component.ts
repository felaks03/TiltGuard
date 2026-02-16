import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  success = false;
  errorMessage = "";

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    this.profileForm = this.fb.group({
      nombre: [
        user?.nombre || "",
        [Validators.required, Validators.minLength(2)],
      ],
      email: [user?.email || "", [Validators.required, Validators.email]],
      telefono: [user?.telefono || ""],
      direccion: [user?.direccion || ""],
      ciudad: [user?.ciudad || ""],
      pais: [user?.pais || ""],
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.loading = true;
    this.success = false;
    this.errorMessage = "";

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => (this.success = false), 3000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || "Error al actualizar el perfil";
      },
    });
  }

  goBack(): void {
    this.router.navigate(["/dashboard"]);
  }
}
