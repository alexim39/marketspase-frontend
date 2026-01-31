
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContactService, ContactMessage } from '../shared/contact.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileSizePipe } from '../shared/file-size.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-contact-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FileSizePipe,
    MatProgressSpinnerModule
  ],
  templateUrl: './contact-detail-dialog.component.html',
  styleUrls: ['./contact-detail-dialog.component.scss'],
  providers: [ContactService]
})
export class ContactDetailDialogComponent implements OnInit {
  contact: ContactMessage;
  newNote = '';
  isSaving = false;
  admins: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ContactDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contact: ContactMessage },
    private contactService: ContactService,
    private snackBar: MatSnackBar
  ) {
    this.contact = data.contact;
  }

  ngOnInit(): void {
    this.loadAdmins();
    this.markAsRead();
  }

  loadAdmins(): void {
    this.contactService.getAdmins().subscribe({
      next: (admins) => {
        this.admins = admins;
      }
    });
  }

  markAsRead(): void {
    if (!this.contact.isRead) {
      this.contactService.markAsRead(this.contact._id).subscribe({
        next: (updatedContact) => {
          this.contact.isRead = true;
        }
      });
    }
  }

  addNote(): void {
    if (!this.newNote.trim()) return;

    this.isSaving = true;
    this.contactService.addNote(this.contact._id, this.newNote).subscribe({
      next: (updatedContact) => {
        this.contact = updatedContact;
        this.newNote = '';
        this.isSaving = false;
        this.showSnackbar('Note added successfully', 'success');
      },
      error: (error) => {
        console.error('Error adding note:', error);
        this.isSaving = false;
        this.showSnackbar('Failed to add note', 'error');
      }
    });
  }

  updateStatus(status: ContactMessage['status']): void {
    this.isSaving = true;
    this.contactService.updateStatus(this.contact._id, status).subscribe({
      next: (updatedContact) => {
        this.contact = updatedContact;
        this.isSaving = false;
        this.showSnackbar('Status updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.isSaving = false;
        this.showSnackbar('Failed to update status', 'error');
      }
    });
  }

  updatePriority(priority: ContactMessage['priority']): void {
    this.isSaving = true;
    this.contactService.updatePriority(this.contact._id, priority).subscribe({
      next: (updatedContact) => {
        this.contact = updatedContact;
        this.isSaving = false;
        this.showSnackbar('Priority updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating priority:', error);
        this.isSaving = false;
        this.showSnackbar('Failed to update priority', 'error');
      }
    });
  }

  assignToAdmin(adminId: string): void {
    this.isSaving = true;
    this.contactService.assignToAdmin(this.contact._id, adminId).subscribe({
      next: (updatedContact) => {
        this.contact = updatedContact;
        this.isSaving = false;
        this.showSnackbar('Assigned successfully', 'success');
      },
      error: (error) => {
        console.error('Error assigning contact:', error);
        this.isSaving = false;
        this.showSnackbar('Failed to assign', 'error');
      }
    });
  }

  setFollowUpDate(date: Date | null): void {
    this.isSaving = true;
    this.contactService.setFollowUpDate(this.contact._id, date).subscribe({
      next: (updatedContact) => {
        this.contact = updatedContact;
        this.isSaving = false;
        this.showSnackbar('Follow-up date updated', 'success');
      },
      error: (error) => {
        console.error('Error setting follow-up date:', error);
        this.isSaving = false;
        this.showSnackbar('Failed to update follow-up date', 'error');
      }
    });
  }

  updateTags(): void {
    this.isSaving = true;
    this.contactService.updateTags(this.contact._id, this.contact.tags).subscribe({
      next: (updatedContact) => {
        this.contact = updatedContact;
        this.isSaving = false;
        this.showSnackbar('Tags updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating tags:', error);
        this.isSaving = false;
        this.showSnackbar('Failed to update tags', 'error');
      }
    });
  }

  addTag(tag: string): void {
    if (tag.trim() && !this.contact.tags.includes(tag.trim())) {
      this.contact.tags.push(tag.trim());
      this.updateTags();
    }
  }

  removeTag(index: number): void {
    this.contact.tags.splice(index, 1);
    this.updateTags();
  }

  downloadAttachment(attachment: any): void {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  close(): void {
    this.dialogRef.close({ refresh: true });
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`]
    });
  }

  // Add these methods to the component class
    getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
        low: 'success',
        medium: 'info',
        high: 'warning',
        urgent: 'error'
    };
    return colors[priority] || 'default';
    }

    getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
        open: 'warning',
        in_progress: 'info',
        resolved: 'success',
        closed: 'default',
        spam: 'error'
    };
    return colors[status] || 'default';
    }

    getAttachmentIcon(fileType: string): string {
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word')) return 'description';
    if (fileType.includes('excel')) return 'table_chart';
    if (fileType.includes('zip') || fileType.includes('compressed')) return 'folder_zip';
    return 'insert_drive_file';
    }
}
