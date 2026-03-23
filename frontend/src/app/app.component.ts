import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./pages/header/header.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "TiltGuard";

  constructor(private router: Router) {}

  get isAuthPage(): boolean {
    return this.router.url === "/login" || this.router.url === "/register";
  }
}
