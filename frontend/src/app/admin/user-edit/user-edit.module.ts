import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserEditComponent } from "./user-edit.component";

@NgModule({
  imports: [CommonModule, UserEditComponent],
  exports: [UserEditComponent],
})
export class UserEditModule {}
