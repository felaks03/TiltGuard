import { Component, HostBinding } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./header/header.component";
import { SidebarComponent } from "./sidebar/sidebar.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "TiltGuard";
  sidebarOpen = true;

  @HostBinding("class.sidebar-closed")
  get sidebarClosed() {
    return !this.sidebarOpen;
  }

  onSidebarToggled(isOpen: boolean) {
    this.sidebarOpen = isOpen;
  }
}
