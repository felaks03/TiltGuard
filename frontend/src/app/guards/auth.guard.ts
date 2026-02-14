import { Injectable } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

/**
 * AuthGuard protege rutas que requieren autenticación
 * Si el usuario NO está autenticado, lo redirige a /login
 */
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si está autenticado, permite el acceso
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si NO está autenticado, redirige a /login
  router.navigate(["/login"]);
  return false;
};
