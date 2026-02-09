import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { AuthGuard } from "./guards/auth.guard";
import { AdminGuard } from "./guards/admin.guard";

/**
 * Rutas de la aplicación TiltGuard
 *
 * Estructura:
 * - PÚBLICAS: /login, /register (sin guards)
 * - ADMIN: /admin/* (requieren AuthGuard + AdminGuard)
 * - USUARIO: /user (requiere AuthGuard)
 * - DEFAULT: / redirige a /login
 */
export const routes: Routes = [
  // ============================================
  // RUTAS PÚBLICAS (sin autenticación requerida)
  // ============================================
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "register",
    component: RegisterComponent,
  },

  // ============================================
  // RUTAS PROTEGIDAS DE ADMINISTRADOR
  // Requieren: autenticación + rol admin
  // ============================================
  {
    path: "admin",
    loadComponent: () =>
      import("./admin/admin-dashboard/admin-dashboard.component").then(
        (m) => m.AdminDashboardComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin/user-list",
    loadComponent: () =>
      import("./admin/userlist/userlist.component").then(
        (m) => m.UserlistComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin/user-details/:id",
    loadComponent: () =>
      import("./admin/user-details/user-details.component").then(
        (m) => m.UserDetailsComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin/user-edit/:id",
    loadComponent: () =>
      import("./admin/user-edit/user-edit.component").then(
        (m) => m.UserEditComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },

  // ============================================
  // RUTAS PROTEGIDAS DE USUARIO
  // Requieren: autenticación (cualquier rol)
  // ============================================
  {
    path: "user",
    loadComponent: () =>
      import("./main/user-dashboard/user-dashboard.component").then(
        (m) => m.UserDashboardComponent,
      ),
    canActivate: [AuthGuard],
  },

  // ============================================
  // RUTAS POR DEFECTO
  // ============================================
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "**",
    redirectTo: "login",
  },
];
