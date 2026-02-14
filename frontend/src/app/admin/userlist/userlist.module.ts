import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserlistComponent } from "./userlist.component";

@NgModule({
  imports: [CommonModule, UserlistComponent],
  exports: [UserlistComponent],
})
export class UserlistModule {}
