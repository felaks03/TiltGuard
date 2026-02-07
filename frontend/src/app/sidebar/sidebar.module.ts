import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SidebarComponent } from "./sidebar.component";
import { SidebarService } from "./sidebar.service";

@NgModule({
  imports: [CommonModule, RouterModule, SidebarComponent],
  providers: [SidebarService],
  exports: [SidebarComponent],
})
export class SidebarModule {}
