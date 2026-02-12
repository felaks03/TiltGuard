import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AdminSidebarComponent } from "./admin-sidebar.component";
import { AdminSidebarService } from "./admin-sidebar.service";

@NgModule({
  imports: [CommonModule, RouterModule, AdminSidebarComponent],
  providers: [AdminSidebarService],
  exports: [AdminSidebarComponent],
})
export class AdminSidebarModule {}
