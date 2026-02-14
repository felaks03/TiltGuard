import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HeaderComponent } from "./header.component";
import { HeaderService } from "./header.service";

@NgModule({
  imports: [CommonModule, HeaderComponent],
  providers: [HeaderService],
  exports: [HeaderComponent],
})
export class HeaderModule {}
