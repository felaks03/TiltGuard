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
        (m) => m.UserlistComponent,
      ),
  },
  {
    path: "admin/user-details/:id",
    loadComponent: () =>
      import("./admin/user-details/user-details.component").then(
        (m) => m.UserDetailsComponent,
      ),
  },
  {
    path: "admin/user-edit/:id",
    loadComponent: () =>
      import("./admin/user-edit/user-edit.component").then(
        (m) => m.UserEditComponent,
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
    redirectTo: "admin/user-list",
    pathMatch: "full",
  },
];
