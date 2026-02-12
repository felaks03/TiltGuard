import { Component, Output, EventEmitter, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { UserSidebarService } from "./user-sidebar.service";

@Component({
  selector: "app-user-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./user-sidebar.component.html",
  styleUrls: ["./user-sidebar.component.scss"],
})
export class UserSidebarComponent implements OnInit {
  isOpen = true;
  currentUser: any = null;
  @Output() sidebarToggled = new EventEmitter<boolean>();

  private sidebarService = inject(UserSidebarService);

  ngOnInit(): void {
    this.currentUser = this.sidebarService.getCurrentUser();
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    this.sidebarToggled.emit(this.isOpen);
  }

  isImpersonating(): boolean {
    return this.sidebarService.isImpersonating();
  }
}
