
import { Component, OnInit, signal, computed, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { ContactService, ContactMessage, ContactFilter, ContactStats } from './shared/contact.service';
import { ConfirmationDialogComponent } from './shared/confirmation-dialog/confirmation-dialog.component';
import { ContactDetailDialogComponent } from './contact-detail-dialog/contact-detail-dialog.component';
import { BulkActionDialogComponent } from './bulk-action-dialog/bulk-action-dialog.component';
import { ExportDialogComponent } from './export-dialog/export-dialog.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'admin-contact-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatMenuModule,
    MatBadgeModule,
    MatCardModule,
    MatDividerModule,
    DatePipe
  ],
  providers: [ContactService],
  templateUrl: './contact-management.component.html',
  styleUrl: './contact-management.component.scss',
})
export class ContactManagementComponent implements OnInit, AfterViewInit {
  private contactService = inject(ContactService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // State with signals
  contacts = signal<ContactMessage[]>([]);
  selectedContacts = signal<string[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  stats = signal<ContactStats | null>(null);
  admins = signal<Array<{ _id: string; username: string; displayName: string }>>([]);

  // Filters
  searchQuery = signal('');
  statusFilter = signal('all');
  priorityFilter = signal('all');
  categoryFilter = signal('all');
  reasonFilter = signal('all');
  assigneeFilter = signal('all');
  dateFromFilter = signal<Date | null>(null);
  dateToFilter = signal<Date | null>(null);
  showArchived = signal(false);

  // Table data source
  dataSource = new MatTableDataSource<ContactMessage>([]);
  displayedColumns: string[] = [
    'select',
    'requestID',
    'user',
    'subject',
    'reason',
    'priority',
    'status',
    'assignedTo',
    'createdAt',
    'actions'
  ];

  // Pagination
  pageSize = signal(20);
  pageIndex = signal(0);
  totalContacts = signal(0);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Computed values
  filteredContacts = computed(() => {
    let filtered = this.contacts();

    // Apply search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(contact =>
        contact.subject.toLowerCase().includes(query) ||
        contact.message.toLowerCase().includes(query) ||
        contact.user.displayName.toLowerCase().includes(query) ||
        contact.user.username.toLowerCase().includes(query) ||
        contact.requestID.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(contact => contact.status === this.statusFilter());
    }

    // Apply priority filter
    if (this.priorityFilter() !== 'all') {
      filtered = filtered.filter(contact => contact.priority === this.priorityFilter());
    }

    // Apply category filter
    if (this.categoryFilter() !== 'all') {
      filtered = filtered.filter(contact => contact.category === this.categoryFilter());
    }

    // Apply reason filter
    if (this.reasonFilter() !== 'all') {
      filtered = filtered.filter(contact => contact.reason === this.reasonFilter());
    }

    // Apply assignee filter
    if (this.assigneeFilter() !== 'all') {
      filtered = filtered.filter(contact => contact.assignedTo?._id === this.assigneeFilter());
    }

    // Apply date filters
    if (this.dateFromFilter()) {
      filtered = filtered.filter(contact => new Date(contact.createdAt) >= this.dateFromFilter()!);
    }

    if (this.dateToFilter()) {
      const endOfDay = new Date(this.dateToFilter()!);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(contact => new Date(contact.createdAt) <= endOfDay);
    }

    // Apply archived filter
    if (!this.showArchived()) {
      filtered = filtered.filter(contact => !contact.isArchived);
    }

    return filtered;
  });

  isAllSelected = computed(() => {
    return this.selectedContacts().length > 0 && 
           this.selectedContacts().length === this.dataSource.data.length;
  });

  ngOnInit(): void {
    this.loadContacts();
    this.loadAdmins();
    this.loadStats();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadContacts(): Promise<void> {
    try {
      this.isLoading.set(true);
      
      const filter: ContactFilter = {
        status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
        priority: this.priorityFilter() !== 'all' ? this.priorityFilter() : undefined,
        category: this.categoryFilter() !== 'all' ? this.categoryFilter() : undefined,
        reason: this.reasonFilter() !== 'all' ? this.reasonFilter() : undefined,
        assignedTo: this.assigneeFilter() !== 'all' ? this.assigneeFilter() : undefined,
        search: this.searchQuery() || undefined,
        dateFrom: this.dateFromFilter() || undefined,
        dateTo: this.dateToFilter() || undefined,
        isArchived: this.showArchived() || undefined
      };

      this.contactService.getContactMessages(
        filter, 
        this.pageIndex() + 1, 
        this.pageSize()
      ).subscribe({
        next: (response) => {
          this.contacts.set(response.data || []);
          this.dataSource.data = response.data || [];
          this.totalContacts.set(response.total);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
          this.isLoading.set(false);
          this.showSnackbar('Failed to load contact messages', 'error');
        }
      });

    } catch (error) {
      console.error('Error loading contacts:', error);
      this.isLoading.set(false);
      this.showSnackbar('Failed to load contact messages', 'error');
    }
  }

  async loadAdmins(): Promise<void> {
    this.contactService.getAdmins().subscribe({
      next: (admins) => {
        this.admins.set(admins);
      },
      error: (error) => {
        console.error('Error loading admins:', error);
      }
    });
  }

  async loadStats(): Promise<void> {
    this.contactService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    this.loadContacts();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
    this.categoryFilter.set('all');
    this.reasonFilter.set('all');
    this.assigneeFilter.set('all');
    this.dateFromFilter.set(null);
    this.dateToFilter.set(null);
    this.selectedContacts.set([]);
    this.applyFilters();
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadContacts();
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedContacts.set([]);
    } else {
      this.selectedContacts.set(this.dataSource.data.map(contact => contact._id));
    }
  }

  toggleSelectContact(contactId: string): void {
    const selected = this.selectedContacts();
    if (selected.includes(contactId)) {
      this.selectedContacts.set(selected.filter(id => id !== contactId));
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

    dialogRef.afterClosed().subscribe(result => {
      if (result?.refresh) {
        this.loadContacts();
      }
    });
  }

  updateStatus(contact: ContactMessage, status: ContactMessage['status']): void {
    this.isProcessing.set(true);
    this.contactService.updateStatus(contact._id, status).subscribe({
      next: (updatedContact) => {
        this.updateContactInList(updatedContact);
        this.showSnackbar(`Status updated to ${status}`, 'success');
        this.isProcessing.set(false);
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
    this.contactService.updatePriority(contact._id, priority).subscribe({
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
    this.contactService.assignToAdmin(contact._id, adminId).subscribe({
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
    this.contactService.markAsArchived(contact._id, archived).subscribe({
      next: (updatedContact) => {
        this.updateContactInList(updatedContact);
        this.showSnackbar(
          archived ? 'Contact archived' : 'Contact unarchived',
          'success'
        );
        this.isProcessing.set(false);
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isProcessing.set(true);
        this.contactService.deleteContactMessage(contact._id).subscribe({
          next: () => {
            this.contacts.set(this.contacts().filter(c => c._id !== contact._id));
            this.applyFilters();
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performBulkAction(result.action, result.data);
      }
    });
  }

  private performBulkAction(action: string, data: any): void {
    this.isProcessing.set(true);
    
    switch (action) {
      case 'updateStatus':
        this.contactService.bulkUpdateStatus(this.selectedContacts(), data.status).subscribe({
          next: (response) => {
            this.showSnackbar(`Updated ${response.updatedCount} contacts`, 'success');
            this.loadContacts();
            this.selectedContacts.set([]);
            this.isProcessing.set(false);
          },
          error: (error) => {
            console.error('Error performing bulk update:', error);
            this.showSnackbar('Failed to update contacts', 'error');
            this.isProcessing.set(false);
          }
        });
        break;
        
      case 'assign':
        // Handle assign bulk action
        break;
        
      case 'archive':
        // Handle archive bulk action
        break;
    }
  }

  openExportDialog(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '600px',
      data: {
        filters: {
          status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
          priority: this.priorityFilter() !== 'all' ? this.priorityFilter() : undefined,
          category: this.categoryFilter() !== 'all' ? this.categoryFilter() : undefined,
          dateFrom: this.dateFromFilter(),
          dateTo: this.dateToFilter()
        }
      }
    });

    dialogRef.afterClosed().subscribe(format => {
      if (format) {
        this.exportContacts(format);
      }
    });
  }

  private exportContacts(format: 'csv' | 'excel'): void {
    this.isProcessing.set(true);
    
    const filter: ContactFilter = {
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      priority: this.priorityFilter() !== 'all' ? this.priorityFilter() : undefined,
      category: this.categoryFilter() !== 'all' ? this.categoryFilter() : undefined,
      reason: this.reasonFilter() !== 'all' ? this.reasonFilter() : undefined,
      dateFrom: this.dateFromFilter() ?? undefined,
      dateTo: this.dateToFilter() ?? undefined,
      isArchived: this.showArchived() || undefined
    };

    this.contactService.exportContacts(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

  private updateContactInList(updatedContact: ContactMessage): void {
    const index = this.contacts().findIndex(c => c._id === updatedContact._id);
    if (index !== -1) {
      const updatedContacts = [...this.contacts()];
      updatedContacts[index] = updatedContact;
      this.contacts.set(updatedContacts);
      this.dataSource.data = updatedContacts;
    }
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

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  yourUpdateMethod(value: string): void {
    this.assigneeFilter.set(value);
    this.onFilterChange();
  }
}
