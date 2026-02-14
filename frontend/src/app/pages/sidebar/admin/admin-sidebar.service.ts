import { Injectable, inject } from "@angular/core";
import { AuthService } from "../../../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class AdminSidebarService {
  private authService = inject(AuthService);

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
