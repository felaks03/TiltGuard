import { Component, OnInit, inject, signal, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AdminSidebarService } from "./admin-sidebar.service";

@Component({
  selector: "app-admin-sidebar",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./admin-sidebar.component.html",
  styleUrls: ["./admin-sidebar.component.scss"],
})
export class AdminSidebarComponent implements OnInit {
  isOpen = signal(true);
  userRole = signal<string | null>(null);
  sidebarToggled = output<boolean>();

  private sidebarService = inject(AdminSidebarService);

  ngOnInit(): void {
    const user = this.sidebarService.getCurrentUser();
    this.userRole.set(user?.rol || null);
  }

  isAdmin(): boolean {
    return this.userRole() === "admin";
  }

  toggleSidebar(): void {
    this.isOpen.update((val) => !val);
    this.sidebarToggled.emit(this.isOpen());
  }
}
