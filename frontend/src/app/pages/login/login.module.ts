import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoginComponent } from "./login.component";
import { LoginService } from "./login.service";

@NgModule({
  imports: [CommonModule, LoginComponent],
  providers: [LoginService],
  exports: [LoginComponent],
})
export class LoginModule {}
