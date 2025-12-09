import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
  selector: 'app-edit-bulk-item-dialog',
  template: `
    <h2 mat-dialog-title>Edit Refund Item</h2>
    <mat-dialog-content>
      <!-- Edit form -->
    </mat-dialog-content>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule]
})
export class EditBulkItemDialogComponent {}