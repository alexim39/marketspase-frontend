import { Component, DestroyRef, inject, signal, computed } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged } from "rxjs";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { ApiService } from "@shared/services";

import {
  ContactService,
  CustomerContact,
  CustomerGroup,
} from "../contact.service";
import { CreateContactDialogComponent } from "./create-contact-dialog.component";
import { ConfirmDeleteDialogComponent } from "./confirm-delete-dialog.component";
import { SmsDialogComponent } from "./sms-dialog.component";
import { BulkSmsDialogComponent } from "./bulk-sms-dialog.component";

@Component({
  selector: "app-contacts-index",
  standalone: true,
  providers: [ContactService, DatePipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    CreateContactDialogComponent,
    ConfirmDeleteDialogComponent,
  ],
  templateUrl: "./contacts-index.component.html",
  styleUrls: ["./contacts-index.component.scss"],
})
export class ContactsIndexComponent {
  readonly contactService = inject(ContactService);
  readonly apiService = inject(ApiService);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly isImporting = signal(false);
  readonly error = signal<string | null>(null);

  readonly customers = signal<CustomerContact[]>([]);
  readonly availableTags = signal<string[]>([]);
  readonly groups = signal<CustomerGroup[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(25);
  readonly totalPages = signal(0);

  // Analytics summary
  readonly analytics = signal<{
    totals: { total: number; withSmsConsent: number; withEmailConsent: number };
    lifecycleBreakdown: Record<string, number>;
    recentAdditions: CustomerContact[];
  } | null>(null);

  // Campaign lead analytics
  readonly leadAnalytics = signal<{
    summary: { totalViews: number; totalLeads: number; conversionRate: number; totalContactMe: number; totalFormViews: number; totalFailures: number };
    byCampaign: Array<{ campaignId: string; title: string; count: number }>;
    byPromoter: Array<{ promoterId: string; name: string; count: number }>;
    recentLeads: Array<{ campaignName: string; promoterName: string; phone: string | null; createdAt: string }>;
  } | null>(null);

  readonly filtersForm = this.fb.group({
    search: [""],
    lifecycleStage: [""],
    source: [""],
    tag: [""],
    group: [""],
    startDate: [""],
    endDate: [""],
  });

  // ── Bulk selection ──
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly isAllSelected = computed(() => {
    const custs = this.customers();
    const sel = this.selectedIds();
    return custs.length > 0 && custs.every((c) => sel.has(c._id));
  });

  readonly lifecycleStages = [
    { value: "", label: "All stages" },
    { value: "new", label: "New" },
    { value: "active", label: "Active" },
    { value: "repeat", label: "Repeat" },
    { value: "vip", label: "VIP" },
    { value: "at_risk", label: "At Risk" },
    { value: "suppressed", label: "Suppressed" },
  ];

  readonly sources = [
    { value: "", label: "All sources" },
    { value: "manual", label: "Manual Entry" },
    { value: "csv_import", label: "CSV Import" },
    { value: "click_capture", label: "Click Capture" },
    { value: "subscriber_sync", label: "Subscriber Sync" },
    { value: "storefront_checkout", label: "Storefront" },
  ];

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  constructor() {
    this.loadCustomers();
    this.loadAnalytics();
    this.loadGroups();
    this.loadLeadAnalytics();

    // Debounced search
    this.filtersForm.controls.search.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadCustomers();
      });

    // Immediate filter changes
    const immediateFilters = [
      this.filtersForm.controls.lifecycleStage,
      this.filtersForm.controls.source,
      this.filtersForm.controls.tag,
      this.filtersForm.controls.group,
    ];
    immediateFilters.forEach((ctrl) =>
      ctrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.currentPage.set(1);
          this.loadCustomers();
        })
    );

    this.filtersForm.controls.startDate.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage.set(1); this.loadCustomers(); });

    this.filtersForm.controls.endDate.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage.set(1); this.loadCustomers(); });
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    const search = this.filtersForm.controls.search.value;
    if (search) params.search = search;

    const stage = this.filtersForm.controls.lifecycleStage.value;
    if (stage) params.lifecycleStage = stage;

    const source = this.filtersForm.controls.source.value;
    if (source) params.source = source;

    const tag = this.filtersForm.controls.tag.value;
    if (tag) params.tags = [tag];

    const group = this.filtersForm.controls.group.value;
    if (group) params.groupId = group;

    const startDate = this.filtersForm.controls.startDate.value;
    if (startDate) params.startDate = startDate;

    const endDate = this.filtersForm.controls.endDate.value;
    if (endDate) params.endDate = endDate;

    this.contactService
      .getCustomers(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.customers.set(response.data.customers);
            this.availableTags.set(response.data.availableTags);
            this.totalItems.set(response.data.pagination.total);
            this.totalPages.set(response.data.pagination.totalPages);
          } else {
            this.error.set("Failed to load contacts");
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || "Error loading contacts");
          this.isLoading.set(false);
        },
      });
  }

  loadAnalytics(): void {
    this.contactService
      .getAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) this.analytics.set(response.data);
        },
      });
  }

  loadGroups(): void {
    this.contactService
      .getGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) this.groups.set(res.data.groups);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: "",
      lifecycleStage: "",
      source: "",
      tag: "",
      group: "",
      startDate: "",
      endDate: "",
    });
    this.currentPage.set(1);
    this.loadCustomers();
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    this.loadCustomers();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
    input.value = "";
  }

  // ── Bulk selection ──
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.customers().map((c) => c._id)));
    }
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  bulkDelete(): void {
    const count = this.selectedIds().size;
    if (count === 0) return;

    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Contacts',
        message: `Delete ${count} contact${count > 1 ? 's' : ''}?`,
        detail: 'This action cannot be undone. The contacts will be permanently removed.',
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;

      const ids = [...this.selectedIds()];
      let done = 0;
      ids.forEach((id) => {
        this.contactService.deleteCustomer(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              done++;
              if (done === ids.length) {
                this.selectedIds.set(new Set());
                this.snackBar.open(`${count} contact${count > 1 ? 's' : ''} deleted`, 'Close', { duration: 2400 });
                this.loadCustomers();
                this.loadAnalytics();
              }
            },
            error: () => {
              done++;
              if (done === ids.length) {
                this.snackBar.open('Some deletions failed', 'Close', { duration: 3000 });
                this.loadCustomers();
              }
            },
          });
      });
    });
  }

  // ── CRUD ──
  deleteContact(id: string, name: string): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Contact',
        message: `Delete "${name}"?`,
        detail: 'This action cannot be undone. The contact will be permanently removed.',
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;

      this.contactService.deleteCustomer(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open('Contact deleted', 'Close', { duration: 2400 });
            this.loadCustomers();
            this.loadAnalytics();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
          },
        });
    });
  }

  handleFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isImporting.set(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split("\n").map((line) => line.trim()).filter(Boolean);

      if (rows.length < 2) {
        this.snackBar.open("CSV must have a header row and at least one data row", "Close", { duration: 4000 });
        this.isImporting.set(false);
        return;
      }

      const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
      const customers = rows.slice(1).map((row) => {
        const values = row.split(",").map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || "";
        });
        return obj;
      });

      this.contactService
        .importCustomers(customers)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.isImporting.set(false);
            this.snackBar.open(
              `Imported ${response.data.imported} contacts (${response.data.skipped} skipped)`,
              "Close",
              { duration: 4000 }
            );
            this.loadCustomers();
            this.loadAnalytics();
            input.value = "";
          },
          error: (err) => {
            this.isImporting.set(false);
            this.snackBar.open(err.error?.message || "Import failed", "Close", { duration: 3000 });
            input.value = "";
          },
        });
    };

    reader.readAsText(file);
  }

  loadLeadAnalytics(): void {
    this.apiService.get<any>('api/v1/campaign/lead/stats').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => { if (r.success) this.leadAnalytics.set(r.data); },
      error: () => {},
    });
  }

  // ── Create / Edit Dialog ──
  openCreateDialog(): void {
    const ref = this.dialog.open(CreateContactDialogComponent, {
      width: "600px",
      maxWidth: "95vw",
      panelClass: "create-contact-dialog-panel",
      autoFocus: false,
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.loadCustomers();
          this.loadAnalytics();
        }
      });
  }

  // ── SMS & Email Actions ──
  openSendSms(customer: CustomerContact): void {
    if (!customer.phone) { this.snackBar.open('Customer has no phone number.', 'OK', { duration: 3000 }); return; }
    const ref = this.dialog.open(SmsDialogComponent, { width: '500px', maxWidth: '95vw', data: { customerId: customer._id, customerName: customer.displayName, phone: customer.phone } });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadCustomers());
  }

  openBulkSms(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) { this.snackBar.open('Select customers to send SMS.', 'OK', { duration: 3000 }); return; }
    const ref = this.dialog.open(BulkSmsDialogComponent, { width: '500px', maxWidth: '95vw', data: { customerIds: ids, count: ids.length } });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadCustomers());
  }

  openSendEmail(customer: CustomerContact): void {
    if (!customer.email) { this.snackBar.open('Customer has no email.', 'OK', { duration: 3000 }); return; }
    window.location.href = `mailto:${encodeURIComponent(customer.email)}?subject=Message from MarketSpase`;
  }

  // ── Helpers ──
  getStageColor(stage: string): string {
    const colors: Record<string, string> = {
      new: "info",
      active: "good",
      repeat: "good",
      vip: "premium",
      at_risk: "warn",
      suppressed: "muted",
    };
    return colors[stage] || "muted";
  }

  getSourceLabel(source: string): string {
    const labels: Record<string, string> = {
      manual: "Manual",
      csv_import: "CSV",
      click_capture: "Click",
      subscriber_sync: "Sync",
      storefront_checkout: "Store",
    };
    return labels[source] || source;
  }
}
