import { Component, HostListener, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent {
  dropdownOpen = false;
  returningToAdmin = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isImpersonating(): boolean {
    return this.authService.isImpersonating();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.nombre || "Usuario";
  }

  get userEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || "";
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  goToProfile(): void {
    this.dropdownOpen = false;
    this.router.navigate(["/profile"]);
  }

  backToAdmin(): void {
    this.returningToAdmin = true;
    this.authService.stopImpersonation().subscribe({
      next: () => {
        this.returningToAdmin = false;
        this.dropdownOpen = false;
        this.router.navigate(["/admin/user-list"]);
      },
      error: (err) => {
        this.returningToAdmin = false;
        const errorMessage =
          err.error?.error ||
          err.message ||
          "Error al volver a la sesión de admin";
        alert(errorMessage);
      },
    });
  }

  logout(): void {
    this.dropdownOpen = false;
    this.authService.logout();
  }

  @HostListener("document:keydown.escape")
  onEscapePress(): void {
    this.dropdownOpen = false;
  }
}
