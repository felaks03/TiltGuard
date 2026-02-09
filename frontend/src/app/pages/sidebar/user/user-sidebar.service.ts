import { Injectable, inject } from "@angular/core";
import { AuthService } from "../../../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class UserSidebarService {
  private authService = inject(AuthService);

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  isImpersonating(): boolean {
    return this.authService.isImpersonating();
  }
}
