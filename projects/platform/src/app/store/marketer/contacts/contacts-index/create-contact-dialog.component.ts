import { Component, DestroyRef, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { ContactService, CustomerContact, CustomerGroup } from "../contact.service";

export interface CreateContactData {
  /** Pre-fill data when editing an existing contact */
  editContact?: CustomerContact;
}

@Component({
  selector: "app-create-contact-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./create-contact-dialog.component.html",
  styleUrls: ["./create-contact-dialog.component.scss"],
})
export class CreateContactDialogComponent implements OnInit {
  readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<CreateContactDialogComponent>);
  readonly data = inject<CreateContactData | null>(MAT_DIALOG_DATA);
  readonly contactService = inject(ContactService);
  readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly isEditMode = signal(false);
  readonly groups = signal<CustomerGroup[]>([]);
  readonly availableTags = signal<string[]>([]);

  readonly form = this.fb.group({
    displayName: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.email]],
    phone: ["", [Validators.pattern(/^[\d\s\-+()]+$/)]],
    phoneCountryCode: ["+234"],
    lifecycleStage: ["new"],
    tags: [[] as string[]],
    groups: [[] as string[]],
    notes: [""],
  });

  // Manual tag input
  readonly tagInput = signal("");
  readonly selectedTags = signal<string[]>([]);

  readonly lifecycleOptions = [
    { value: "new", label: "New" },
    { value: "active", label: "Active" },
    { value: "repeat", label: "Repeat" },
    { value: "vip", label: "VIP" },
    { value: "at_risk", label: "At Risk" },
    { value: "suppressed", label: "Suppressed" },
  ];

  ngOnInit(): void {
    this.loadGroups();
    this.loadTags();

    if (this.data?.editContact) {
      this.isEditMode.set(true);
      const c = this.data.editContact;
      this.form.patchValue({
        displayName: c.displayName,
        email: c.email,
        phone: c.phone,
        phoneCountryCode: c.phoneCountryCode,
        lifecycleStage: c.lifecycleStage,
        tags: c.tags,
        groups: c.groups.map((g) => g._id),
        notes: c.notes,
      });
      this.selectedTags.set(c.tags);
    }
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

  loadTags(): void {
    this.contactService
      .getTags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success)
            this.availableTags.set(res.data.map((t) => t.name));
        },
      });
  }

  addTag(tag: string): void {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || this.selectedTags().includes(trimmed)) return;
    this.selectedTags.update((t) => [...t, trimmed]);
    this.form.controls.tags.setValue(this.selectedTags());
    this.tagInput.set("");
  }

  removeTag(tag: string): void {
    this.selectedTags.update((t) => t.filter((x) => x !== tag));
    this.form.controls.tags.setValue(this.selectedTags());
  }

  toggleGroup(groupId: string): void {
    const current = this.form.controls.groups.value || [];
    if (current.includes(groupId)) {
      this.form.controls.groups.setValue(current.filter((id) => id !== groupId));
    } else {
      this.form.controls.groups.setValue([...current, groupId]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const payload: any = {
      displayName: raw.displayName,
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      phoneCountryCode: raw.phoneCountryCode || "+234",
      lifecycleStage: raw.lifecycleStage || "new",
      tags: this.selectedTags(),
      notes: raw.notes || undefined,
    };

    const obs$ = this.isEditMode()
      ? this.contactService.updateCustomer(this.data!.editContact!._id, payload)
      : this.contactService.createCustomer(payload);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          this.isEditMode() ? "Contact updated" : "Contact created",
          "Close",
          { duration: 2000 }
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          err.error?.message || "Operation failed",
          "Close",
          { duration: 3000 }
        );
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
