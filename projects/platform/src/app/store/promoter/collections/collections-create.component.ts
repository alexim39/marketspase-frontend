import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs';
import { ApiService } from '@shared/services';

@Component({
  selector: 'app-collections-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './collections-create.component.html',
  styleUrls: ['./collections-create.component.scss'],
})
export class CollectionsCreateComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    coverImage: [''],
  });

  submitting = signal<boolean>(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const payload = {
      name: this.form.value.name?.trim(),
      description: this.form.value.description?.trim() || undefined,
      coverImage: this.form.value.coverImage?.trim() || undefined,
    };

    this.apiService.post<any>('api/v1/stores/promoter/collections', payload)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const collection = response?.data ?? response;
          this.snackBar.open('Collection created successfully', 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.router.navigate(['dashboard/stores/collections', collection._id]);
        },
        error: () => {
          this.submitting.set(false);
          this.snackBar.open('Failed to create collection. Please try again.', 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
      });
  }

  cancel(): void {
    this.router.navigate(['dashboard/stores/collections']);
  }
}
