import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserDashboardComponent } from "./user-dashboard.component";

@NgModule({
  imports: [CommonModule, UserDashboardComponent],
  exports: [UserDashboardComponent],
})
export class UserDashboardModule {}

