import { Component, OnInit, signal, computed, inject, DestroyRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ContactService, ContactMessage, ContactFilter, ContactStats } from './shared/contact.service';
import { ConfirmationDialogComponent } from './shared/confirmation-dialog/confirmation-dialog.component';
import { ContactDetailDialogComponent } from './contact-detail-dialog/contact-detail-dialog.component';
import { BulkActionDialogComponent } from './bulk-action-dialog/bulk-action-dialog.component';
import { ExportDialogComponent } from './export-dialog/export-dialog.component';

@Component({
  selector: 'admin-contact-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatProgressBarModule,
    DatePipe
  ],
  providers: [ContactService],
  templateUrl: './contact-management.component.html',
  styleUrl: './contact-management.component.scss',
})
export class ContactManagementComponent implements OnInit {
  private contactService = inject(ContactService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  contacts = signal<ContactMessage[]>([]);
  selectedContacts = signal<string[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  stats = signal<ContactStats | null>(null);
  admins = signal<Array<{ _id: string; username: string; displayName: string }>>([]);

  dataSource = new MatTableDataSource<ContactMessage>([]);

  readonly filtersForm = this.fb.group({
    search: [''],
    status: [[] as string[]],
    priority: [[] as string[]],
    category: [''],
    assignee: [''],
    dateFrom: [''],
    dateTo: [''],
    showArchived: [false]
  });

  currentPage = signal(1);
  pageSize = signal(20);
  totalContacts = signal(0);
  totalPages = signal(0);

  activeMenuContact: ContactMessage | null = null;

  readonly statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'spam', label: 'Spam' }
  ];

  readonly priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  readonly categoryOptions = [
    { value: 'support', label: 'Support' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'praise', label: 'Praise' },
    { value: 'partnership', label: 'Partnership' }
  ];

  readonly statusActionOptions: ContactMessage['status'][] = [
    'open', 'in_progress', 'resolved', 'closed', 'spam'
  ];

  readonly priorityActionOptions: ContactMessage['priority'][] = [
    'low', 'medium', 'high', 'urgent'
  ];

  readonly selectedStatuses = computed(() => this.filtersForm.controls.status.value ?? []);
  readonly selectedPriorities = computed(() => this.filtersForm.controls.priority.value ?? []);

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly inProgressCount = computed(() => {
    const stats = this.stats();
    if (!stats?.byStatus?.length) return 0;
    return stats.byStatus.find((item) => item._id === 'in_progress')?.count ?? 0;
  });

  readonly unreadOnPage = computed(() =>
    this.dataSource.data.filter((contact) => !contact.isRead).length
  );

  isAllSelected = computed(() =>
    this.selectedContacts().length > 0 &&
    this.selectedContacts().length === this.dataSource.data.length
  );

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenu();
  }

  ngOnInit(): void {
    this.loadAdmins();
    this.loadStats();
    this.loadContacts();

    this.filtersForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadContacts();
      });
  }

  loadContacts(): void {
    this.isLoading.set(true);
    const filter = this.buildFilter();

    this.contactService.getContactMessages(filter, this.currentPage(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.contacts.set(response.data || []);
          this.dataSource.data = response.data || [];
          this.totalContacts.set(response.total);
          this.totalPages.set(Math.max(1, Math.ceil(response.total / this.pageSize())));
          if (response.stats) {
            this.stats.set(response.stats);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
          this.isLoading.set(false);
          this.showSnackbar('Failed to load contact messages', 'error');
        }
      });
  }

  loadAdmins(): void {
    this.contactService.getAdmins()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (admins) => this.admins.set(admins),
        error: (error) => console.error('Error loading admins:', error)
      });
  }

  loadStats(): void {
    this.contactService.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (error) => console.error('Error loading stats:', error)
      });
  }

  buildFilter(): ContactFilter {
    const values = this.filtersForm.value;
    const statuses = values.status ?? [];
    const priorities = values.priority ?? [];

    return {
      status: statuses.length === 1 ? statuses[0] : undefined,
      priority: priorities.length === 1 ? priorities[0] : undefined,
      category: values.category || undefined,
      assignedTo: values.assignee || undefined,
      search: values.search?.trim() || undefined,
      dateFrom: values.dateFrom ? new Date(values.dateFrom) : undefined,
      dateTo: values.dateTo ? new Date(values.dateTo) : undefined,
      isArchived: values.showArchived || undefined
    };
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadContacts();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: [],
      priority: [],
      category: '',
      assignee: '',
      dateFrom: '',
      dateTo: '',
      showArchived: false
    });
    this.selectedContacts.set([]);
    this.currentPage.set(1);
    this.loadContacts();
  }

  toggleStatusFilter(value: string): void {
    const current = this.filtersForm.controls.status.value ?? [];
    const next = current.includes(value) ? [] : [value];
    this.filtersForm.controls.status.setValue(next);
  }

  togglePriorityFilter(value: string): void {
    const current = this.filtersForm.controls.priority.value ?? [];
    const next = current.includes(value) ? [] : [value];
    this.filtersForm.controls.priority.setValue(next);
  }

  toggleShowArchived(): void {
    const current = this.filtersForm.controls.showArchived.value ?? false;
    this.filtersForm.controls.showArchived.setValue(!current);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedContacts.set([]);
    } else {
      this.selectedContacts.set(this.dataSource.data.map((contact) => contact._id));
    }
  }

  toggleSelectContact(contactId: string): void {
    const selected = this.selectedContacts();
    if (selected.includes(contactId)) {
      this.selectedContacts.set(selected.filter((id) => id !== contactId));
    } else {
      this.selectedContacts.set([...selected, contactId]);
    }
  }

  viewDetails(contact: ContactMessage): void {
    const dialogRef = this.dialog.open(ContactDetailDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { contact }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.refresh) {
          this.loadContacts();
          this.loadStats();
        }
      });
  }

  updateStatus(contact: ContactMessage, status: ContactMessage['status']): void {
    this.isProcessing.set(true);
    this.contactService.updateStatus(contact._id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedContact) => {
          this.updateContactInList(updatedContact);
          this.showSnackbar(`Status updated to ${this.formatStatus(status)}`, 'success');
          this.isProcessing.set(false);
          this.loadStats();
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.showSnackbar('Failed to update status', 'error');
          this.isProcessing.set(false);
        }
      });
  }

  updatePriority(contact: ContactMessage, priority: ContactMessage['priority']): void {
    this.isProcessing.set(true);
    this.contactService.updatePriority(contact._id, priority)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedContact) => {
          this.updateContactInList(updatedContact);
          this.showSnackbar(`Priority updated to ${priority}`, 'success');
          this.isProcessing.set(false);
        },
        error: (error) => {
          console.error('Error updating priority:', error);
          this.showSnackbar('Failed to update priority', 'error');
          this.isProcessing.set(false);
        }
      });
  }

  assignToAdmin(contact: ContactMessage, adminId: string): void {
    this.isProcessing.set(true);
    this.contactService.assignToAdmin(contact._id, adminId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedContact) => {
          this.updateContactInList(updatedContact);
          this.showSnackbar('Contact assigned successfully', 'success');
          this.isProcessing.set(false);
        },
        error: (error) => {
          console.error('Error assigning contact:', error);
          this.showSnackbar('Failed to assign contact', 'error');
          this.isProcessing.set(false);
        }
      });
  }

  markAsArchived(contact: ContactMessage, archived: boolean): void {
    this.isProcessing.set(true);
    this.contactService.markAsArchived(contact._id, archived)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedContact) => {
          this.updateContactInList(updatedContact);
          this.showSnackbar(archived ? 'Contact archived' : 'Contact unarchived', 'success');
          this.isProcessing.set(false);
          if (!this.filtersForm.controls.showArchived.value && archived) {
            this.loadContacts();
          }
        },
        error: (error) => {
          console.error('Error updating archive status:', error);
          this.showSnackbar('Failed to update archive status', 'error');
          this.isProcessing.set(false);
        }
      });
  }

  deleteContact(contact: ContactMessage): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Contact Message',
        message: 'Are you sure you want to delete this contact message? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.isProcessing.set(true);
          this.contactService.deleteContactMessage(contact._id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.contacts.set(this.contacts().filter((item) => item._id !== contact._id));
                this.loadContacts();
                this.loadStats();
                this.showSnackbar('Contact message deleted successfully', 'success');
                this.isProcessing.set(false);
              },
              error: (error) => {
                console.error('Error deleting contact:', error);
                this.showSnackbar('Failed to delete contact message', 'error');
                this.isProcessing.set(false);
              }
            });
        }
      });
  }

  openBulkActions(): void {
    if (this.selectedContacts().length === 0) {
      this.showSnackbar('Please select contacts to perform bulk actions', 'error');
      return;
    }

    const dialogRef = this.dialog.open(BulkActionDialogComponent, {
      width: '500px',
      data: {
        selectedCount: this.selectedContacts().length,
        availableAdmins: this.admins()
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.performBulkAction(result.action, result.data);
        }
      });
  }

  private performBulkAction(action: string, data: Record<string, unknown>): void {
    this.isProcessing.set(true);
    const ids = this.selectedContacts();

    const onComplete = (message: string) => {
      this.showSnackbar(message, 'success');
      this.loadContacts();
      this.loadStats();
      this.selectedContacts.set([]);
      this.isProcessing.set(false);
    };

    const onError = (message: string, error: unknown) => {
      console.error(message, error);
      this.showSnackbar(message, 'error');
      this.isProcessing.set(false);
    };

    switch (action) {
      case 'updateStatus':
        this.contactService.bulkUpdateStatus(ids, data['status'] as ContactMessage['status'])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => onComplete(`Updated ${response.updatedCount} contacts`),
            error: (error) => onError('Failed to update contacts', error)
          });
        break;

      case 'assign':
        this.contactService.bulkAssign(ids, data['adminId'] as string)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => onComplete(`Assigned ${response.updatedCount} contacts`),
            error: (error) => onError('Failed to assign contacts', error)
          });
        break;

      case 'archive':
        this.contactService.bulkArchive(ids, Boolean(data['archive']))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => onComplete(`Updated ${response.updatedCount} contacts`),
            error: (error) => onError('Failed to archive contacts', error)
          });
        break;

      default:
        this.isProcessing.set(false);
        break;
    }
  }

  openExportDialog(): void {
    const values = this.filtersForm.value;
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '600px',
      data: {
        filters: {
          status: (values.status?.length === 1 ? values.status[0] : undefined),
          priority: (values.priority?.length === 1 ? values.priority[0] : undefined),
          category: values.category || undefined,
          dateFrom: values.dateFrom ? new Date(values.dateFrom) : undefined,
          dateTo: values.dateTo ? new Date(values.dateTo) : undefined
        }
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((format) => {
        if (format) {
          this.exportContacts(format);
        }
      });
  }

  private exportContacts(format: 'csv' | 'excel'): void {
    this.isProcessing.set(true);
    const filter = this.buildFilter();

    this.contactService.exportContacts(filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `contacts_export_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          window.URL.revokeObjectURL(url);
          this.isProcessing.set(false);
          this.showSnackbar('Export completed successfully', 'success');
        },
        error: (error) => {
          console.error('Error exporting contacts:', error);
          this.isProcessing.set(false);
          this.showSnackbar('Failed to export contacts', 'error');
        }
      });
  }

  toggleMenu(event: MouseEvent, contact: ContactMessage): void {
    event.stopPropagation();
    this.activeMenuContact = this.activeMenuContact?._id === contact._id ? null : contact;
  }

  closeMenu(): void {
    this.activeMenuContact = null;
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    this.loadContacts();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
    input.value = '';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  formatResponseTime(milliseconds: number): string {
    if (!milliseconds || milliseconds <= 0) return 'N/A';

    const totalMinutes = Math.round(milliseconds / 60000);
    if (totalMinutes < 60) return `${totalMinutes}m`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  private updateContactInList(updatedContact: ContactMessage): void {
    const index = this.contacts().findIndex((item) => item._id === updatedContact._id);
    if (index !== -1) {
      const updatedContacts = [...this.contacts()];
      updatedContacts[index] = updatedContact;
      this.contacts.set(updatedContacts);
      this.dataSource.data = updatedContacts;
    }
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
