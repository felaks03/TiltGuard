import { Component, HostListener, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent {
  dropdownOpen = false;

  private authService = inject(AuthService);
  private router = inject(Router);

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

  logout(): void {
    this.dropdownOpen = false;
    this.authService.logout();
  }

  @HostListener("document:keydown.escape")
  onEscapePress(): void {
    this.dropdownOpen = false;
  }
}
