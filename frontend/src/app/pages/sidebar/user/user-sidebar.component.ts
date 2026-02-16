import { Component, OnInit, inject, signal, output } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { UserSidebarService } from "./user-sidebar.service";

@Component({
  selector: "app-user-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: "./user-sidebar.component.html",
  styleUrls: ["./user-sidebar.component.scss"],
})
export class UserSidebarComponent implements OnInit {
  isOpen = signal(true);
  currentUser = signal<any>(null);
  sidebarToggled = output<boolean>();

  private sidebarService = inject(UserSidebarService);

  ngOnInit(): void {
    this.currentUser.set(this.sidebarService.getCurrentUser());
  }

  toggleSidebar(): void {
    this.isOpen.update((val) => !val);
    this.sidebarToggled.emit(this.isOpen());
  }

  isImpersonating(): boolean {
    return this.sidebarService.isImpersonating();
  }
}
