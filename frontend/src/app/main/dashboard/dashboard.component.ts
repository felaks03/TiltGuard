import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  ngOnInit(): void {
    console.log("✅ Dashboard del Usuario inicializado");
  }
}
