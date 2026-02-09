import { Injectable } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

/**
 * AdminGuard protege rutas que requieren ser admin
 * - Si eres admin, permite el acceso
 * - Si eres usuario regular, redirige a /user
 * - Si no estás autenticado, redirige a /login
 */
export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si está autenticado Y es admin, permite el acceso
  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Si está autenticado pero NO es admin, redirige a /user
  if (authService.isAuthenticated()) {
    router.navigate(["/user"]);
    return false;
  }

  // Si NO está autenticado, redirige a /login
  router.navigate(["/login"]);
  return false;
};
