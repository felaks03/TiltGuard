import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminComponent } from "./admin.component";
import { AdminService } from "./admin.service";

@NgModule({
  imports: [CommonModule, AdminComponent],
  providers: [AdminService],
  exports: [AdminComponent],
})
export class AdminModule {}
