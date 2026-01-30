
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bulk-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './bulk-action-dialog.component.html',
  styleUrls: ['./bulk-action-dialog.component.scss']
})
export class BulkActionDialogComponent implements OnInit {
  selectedAction = 'updateStatus';
  selectedStatus = 'in_progress';
  selectedPriority = 'medium';
  selectedAdmin = '';
  customMessage = '';
  sendEmailNotification = false;

  constructor(
    public dialogRef: MatDialogRef<BulkActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      selectedCount: number;
      availableAdmins: Array<{ _id: string; username: string; displayName: string }>;
    }
  ) {}

  ngOnInit(): void {
    // Default to first admin if available
    if (this.data.availableAdmins.length > 0) {
      this.selectedAdmin = this.data.availableAdmins[0]._id;
    }
  }

  get availableActions() {
    return [
      { value: 'updateStatus', label: 'Update Status', icon: 'swap_vert' },
      { value: 'updatePriority', label: 'Update Priority', icon: 'flag' },
      { value: 'assign', label: 'Assign to Admin', icon: 'person_add' },
      { value: 'archive', label: 'Archive/Unarchive', icon: 'archive' },
      { value: 'sendMessage', label: 'Send Message', icon: 'email' }
    ];
  }

  get statuses() {
    return [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'closed', label: 'Closed' },
      { value: 'spam', label: 'Spam' }
    ];
  }

  get priorities() {
    return [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ];
  }

  confirm(): void {
    const result = {
      action: this.selectedAction,
      data: this.getActionData()
    };
    this.dialogRef.close(result);
  }

  private getActionData(): any {
    switch (this.selectedAction) {
      case 'updateStatus':
        return { status: this.selectedStatus };
      case 'updatePriority':
        return { priority: this.selectedPriority };
      case 'assign':
        return { adminId: this.selectedAdmin };
      case 'archive':
        return { archive: true };
      case 'sendMessage':
        return {
          message: this.customMessage,
          sendEmail: this.sendEmailNotification
        };
      default:
        return {};
    }
  }
}
