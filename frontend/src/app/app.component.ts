import { Component, HostBinding, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./pages/header/header.component";
import { AdminSidebarComponent } from "./pages/sidebar/admin/admin-sidebar.component";
import { UserSidebarComponent } from "./pages/sidebar/user/user-sidebar.component";
import { AuthService } from "./services/auth.service";
import { signal } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    AdminSidebarComponent,
    UserSidebarComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "TiltGuard";
  sidebarOpen = true;
  detieneImpersonacion = signal<boolean>(false);

  private authService = inject(AuthService);

  @HostBinding("class.sidebar-closed")
  get sidebarClosed() {
    return !this.sidebarOpen;
  }

  constructor(private router: Router) {}

  get isAuthPage(): boolean {
    return this.router.url === "/login" || this.router.url === "/register";
  }

  get isImpersonating(): boolean {
    return this.authService.isImpersonating();
  }

  get impersonatedUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.nombre || "Usuario";
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onSidebarToggled(isOpen: boolean) {
    this.sidebarOpen = isOpen;
  }

  stopImpersonation(): void {
    this.detieneImpersonacion.set(true);
    this.authService.stopImpersonation().subscribe({
      next: () => {
        this.detieneImpersonacion.set(false);
        // Redirigir al dashboard del admin
        this.router.navigate(["/admin/user-list"]);
      },
      error: (err) => {
        this.detieneImpersonacion.set(false);
        const errorMessage =
          err.error?.error ||
          err.message ||
          "Error al salir de la suplantación";
        alert(errorMessage);
      },
    });
  }
}
