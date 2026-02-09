import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RegisterComponent } from "./register.component";
import { RegisterService } from "./register.service";

@NgModule({
  imports: [CommonModule, RegisterComponent],
  providers: [RegisterService],
  exports: [RegisterComponent],
})
export class RegisterModule {}
