import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { UserSidebarComponent } from "./user-sidebar.component";
import { UserSidebarService } from "./user-sidebar.service";

@NgModule({
  imports: [CommonModule, RouterModule, UserSidebarComponent],
  providers: [UserSidebarService],
  exports: [UserSidebarComponent],
})
export class UserSidebarModule {}
