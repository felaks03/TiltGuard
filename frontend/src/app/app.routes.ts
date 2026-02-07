import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "admin",
    loadComponent: () =>
      import("./admin/admin.component").then((m) => m.AdminComponent),
  },
  {
    path: "usuarios",
    loadComponent: () =>
      import("./user/user.component").then((m) => m.UserComponent),
  },
  {
    path: "user",
    loadComponent: () =>
      import("./user/user.component").then((m) => m.UserComponent),
  },
  {
    path: "",
    redirectTo: "usuarios",
    pathMatch: "full",
  },
];
