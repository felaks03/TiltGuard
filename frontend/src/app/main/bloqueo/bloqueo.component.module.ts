import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { BloqueoComponent } from "./bloqueo.component";

@NgModule({
  imports: [CommonModule, FormsModule, BloqueoComponent],
  exports: [BloqueoComponent],
})
export class BloqueoModule {}
