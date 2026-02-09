import { Component, HostBinding } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./pages/header/header.component";
import { SidebarComponent } from "./pages/sidebar/sidebar.component";

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

  constructor(private router: Router) {}

  get isAuthPage(): boolean {
    return this.router.url === "/login" || this.router.url === "/register";
  }

  onSidebarToggled(isOpen: boolean) {
    this.sidebarOpen = isOpen;
  }
}
