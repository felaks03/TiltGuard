import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-user-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./user-dashboard.component.html",
  styleUrls: ["./user-dashboard.component.scss"],
})
export class UserDashboardComponent {
  constructor() {
    console.log("✅ Dashboard del Usuario inicializado");
  }
}
