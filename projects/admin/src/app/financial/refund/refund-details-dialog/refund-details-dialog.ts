import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";

@Component({
  selector: 'app-refund-details-dialog',
  template: `
    <h2 mat-dialog-title>Refund Details</h2>
    <mat-dialog-content>
      <!-- Refund details display -->
    </mat-dialog-content>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class RefundDetailsDialogComponent {}