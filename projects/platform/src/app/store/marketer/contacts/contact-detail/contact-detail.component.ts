import { Component, DestroyRef, inject, signal } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

import { ContactService, CustomerContact, ContactLogEntry } from "../contact.service";
import { SmsDialogComponent } from "../contacts-index/sms-dialog.component";

@Component({
  selector: "app-contact-detail",
  standalone: true,
  providers: [ContactService, DatePipe],
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: "./contact-detail.component.html",
  styleUrls: ["./contact-detail.component.scss"],
})
export class ContactDetailComponent {
  readonly contactService = inject(ContactService);
  readonly snackBar = inject(MatSnackBar);
  readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly customer = signal<CustomerContact | null>(null);
  readonly logs = signal<ContactLogEntry[]>([]);
  readonly error = signal<string | null>(null);

  // Add note
  readonly newNote = signal("");

  constructor() {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) this.loadCustomer(id);
  }

  loadCustomer(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.contactService.getCustomer(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.customer.set(response.data.customer);
            this.logs.set(response.data.logs);
          } else {
            this.error.set("Contact not found");
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || "Failed to load contact");
          this.isLoading.set(false);
        },
      });
  }

  addNote(): void {
    const content = this.newNote().trim();
    if (!content) return;

    const c = this.customer();
    if (!c) return;

    this.contactService.addCustomerLog(c._id, {
      type: "note",
      content,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.newNote.set("");
          this.snackBar.open("Note added", "Close", { duration: 2000 });
          this.loadCustomer(c._id);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || "Failed to add note", "Close", { duration: 3000 });
        },
      });
  }

  toggleConsent(channel: "sms" | "email"): void {
    const c = this.customer();
    if (!c) return;

    const current = channel === "sms" ? c.consent.sms : c.consent.email;
    const action = current ? "opt_out" : "opt_in";

    this.contactService.updateConsent(c._id, channel, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.customer.set(response.data);
            this.snackBar.open(
              `${channel.toUpperCase()} consent ${action === "opt_in" ? "granted" : "withdrawn"}`,
              "Close",
              { duration: 2400 }
            );
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || "Failed to update consent", "Close", { duration: 3000 });
        },
      });
  }

  updateStage(stage: string): void {
    const c = this.customer();
    if (!c) return;

    this.contactService.updateCustomer(c._id, { lifecycleStage: stage as any })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.customer.set(response.data);
            this.snackBar.open(`Stage updated to ${stage}`, "Close", { duration: 2000 });
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || "Failed to update", "Close", { duration: 3000 });
        },
      });
  }

  getLogIcon(type: string): string {
    const icons: Record<string, string> = {
      note: "notes",
      sms: "chat",
      email: "email",
      call: "call",
      whatsapp: "chat",
      purchase: "shopping_cart",
    };
    return icons[type] || "info";
  }

  getLogColor(type: string): string {
    const colors: Record<string, string> = {
      note: "#6b7280",
      sms: "#a78bfa",
      email: "#38bdf8",
      call: "#10b981",
      whatsapp: "#25D366",
      purchase: "#f59e0b",
    };
    return colors[type] || "#6b7280";
  }

  getStageColor(stage: string): string {
    const colors: Record<string, string> = {
      new: "#38bdf8",
      active: "#10b981",
      repeat: "#10b981",
      vip: "#a78bfa",
      at_risk: "#eab308",
      suppressed: "#6b7280",
    };
    return colors[stage] || "#6b7280";
  }

  openSendSms(): void {
    const c = this.customer(); if (!c || !c.phone) { this.snackBar.open('No phone number.', 'OK', { duration: 3000 }); return; }
    const ref = this.dialog.open(SmsDialogComponent, { width: '500px', maxWidth: '95vw', data: { customerId: c._id, customerName: c.displayName, phone: c.phone } });
    ref.afterClosed().subscribe(() => this.loadCustomer(c._id));
  }

  openSendEmail(): void {
    const c = this.customer(); if (!c?.email) { this.snackBar.open('No email.', 'OK', { duration: 3000 }); return; }
    window.location.href = `mailto:${encodeURIComponent(c.email)}?subject=Message from MarketSpase`;
  }

  copyToClipboard(text: string | undefined): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open("Copied!", "Close", { duration: 1500 });
    });
  }
}
