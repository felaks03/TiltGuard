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
      import("./main/dashboard/dashboard.component").then((m) => m.DashboardComponent),
  },
  {
    path: "user",
    loadComponent: () =>
      import("./main/dashboard/dashboard.component").then((m) => m.DashboardComponent),
  },
  {
    path: "",
    redirectTo: "admin",
    pathMatch: "full",
  },
];
