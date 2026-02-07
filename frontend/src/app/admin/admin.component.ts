import { Component } from "@angular/core";
import { UserComponent } from "./userlist/user.component";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [UserComponent],
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"],
})
export class AdminComponent {}
