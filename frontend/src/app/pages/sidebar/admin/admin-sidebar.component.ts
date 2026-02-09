import { Component, Output, EventEmitter, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AdminSidebarService } from "./admin-sidebar.service";

@Component({
  selector: "app-admin-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./admin-sidebar.component.html",
  styleUrls: ["./admin-sidebar.component.scss"],
})
export class AdminSidebarComponent implements OnInit {
  isOpen = true;
  userRole: string | null = null;
  @Output() sidebarToggled = new EventEmitter<boolean>();

  private sidebarService = inject(AdminSidebarService);

  ngOnInit(): void {
    const user = this.sidebarService.getCurrentUser();
    this.userRole = user?.rol || null;
  }

  isAdmin(): boolean {
    return this.userRole === "admin";
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    this.sidebarToggled.emit(this.isOpen);
  }
}
