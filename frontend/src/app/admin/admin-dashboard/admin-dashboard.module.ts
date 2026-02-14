import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminDashboardComponent } from "./admin-dashboard.component";

@NgModule({
  imports: [CommonModule, AdminDashboardComponent],
  exports: [AdminDashboardComponent],
})
export class AdminDashboardModule {}
