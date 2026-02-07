import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "admin",
    loadComponent: () =>
      import("./admin/admin-dashboard/admin-dashboard.component").then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: "admin/user-list",
    loadComponent: () =>
      import("./admin/userlist/userlist.component").then(
        (m) => m.UserlistComponent
      ),
  },
  {
    path: "user",
    loadComponent: () =>
      import("./main/user-dashboard/user-dashboard.component").then(
        (m) => m.UserDashboardComponent,
      ),
  },
  {
    path: "",
    redirectTo: "admin",
    pathMatch: "full",
  },
];
