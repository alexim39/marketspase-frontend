import { ChangeDetectorRef, Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { SettingsService } from '../../settings.service';
import { UserInterface } from '../../../common/services/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsernameDialogComponent } from './help-dialog.component';

@Component({
  selector: 'async-username-info',
  standalone: true,
  providers: [SettingsService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.scss']
})
export class UsernameInfoComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  // List of restricted words
  private restrictedWords = ['davido', 'davidotv', '30gb', 'obo'];

  @Input() user!: UserInterface;
  usernameForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && !changes['user'].firstChange) {
      this.updateFormWithUserData();
    }
  }

  private initializeForm(): void {
    this.usernameForm = new FormGroup({
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
        this.restrictedWordsValidator.bind(this) // Add custom validator
      ]),
      id: new FormControl('')
    });

    // Update form if user data is already available
    if (this.user) {
      this.updateFormWithUserData();
    }
  }

  // Custom validator for restricted words
  private restrictedWordsValidator(control: FormControl): { [key: string]: any } | null {
    const value = control.value?.toLowerCase();
    if (!value) return null;

    const isRestricted = this.restrictedWords.some(word => 
      value.includes(word.toLowerCase())
    );

    return isRestricted ? { 'restrictedWord': true } : null;
  }

  private updateFormWithUserData(): void {
    this.usernameForm.patchValue({
      username: this.user?.username || '',
      id: this.user?._id || ''
    });
    this.cdr.markForCheck(); // Ensure UI updates with new data
  }

  onSubmit(): void {
    if (this.usernameForm.invalid) {
      if (this.usernameForm.get('username')?.errors?.['restrictedWord']) {
        this.showNotification('This username contains a restricted word. Please choose another one.');
      } else {
        this.showNotification('Please enter a valid username');
      }
      this.usernameForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const usernameData = this.usernameForm.value;

    this.subscriptions.push(
      this.settingsService.updateUsername(usernameData).subscribe({
        next: (response) => {
          this.showNotification('Username updated successfully!', 'success');
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection after async operation
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Failed to update username. Please try again.';
          this.showNotification(errorMessage);
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection after error
        }
      })
    );
  }

  showHelp(): void {
    const dialogRef = this.dialog.open(UsernameDialogComponent, {
      width: '450px',
      data: {
        title: 'Username Guidelines',
        content: `
          <p>Your username will be part of your unique profile URL (davidotv.com/yourname).</p>
          
          <h4>Requirements:</h4>
          <ul>
            <li>3-30 characters long</li>
            <li>Only letters, numbers and underscores (_)</li>
            <li>No spaces or special characters</li>
            <li>Cannot contain restricted words (davido, davidotv, 30gb)</li>
          </ul>

          <h4>Good Examples:</h4>
          <ul>
            <li>davidotv.com/superfan</li>
            <li>davidotv.com/davido_forever</li>
            <li>davidotv.com/music_lover_2023</li>
          </ul>

          <p>Choose something memorable that represents you in the Davidotv community!</p>
        `
      },
      panelClass: 'help-dialog'
    });

    // Handle dialog closing if needed
    this.subscriptions.push(
      dialogRef.afterClosed().subscribe(() => {
        // Any cleanup or post-dialog logic
      })
    );
  }

  private showNotification(message: string, panelClass: string = 'error'): void {
    this.snackBar.open(message, 'Close', { 
      duration: 5000,
      panelClass: [`snackbar-${panelClass}`]
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}