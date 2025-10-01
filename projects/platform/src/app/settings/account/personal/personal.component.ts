import { Component, inject, Input, Signal, effect, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { HttpErrorResponse } from '@angular/common/http';
import { computed, signal } from '@angular/core';

import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { COUNTRIES } from '../../../common/utils/countries';
import { NIGERIAN_STATES } from '../../../common/utils/nigerian-states';
import { ProfileService } from '../profile.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'async-personal-infor',
  providers: [ProfileService],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatAutocompleteModule
  ],
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalInfoComponent {

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private snackBar = inject(MatSnackBar);
  private profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private userService = inject(UserService);

  // Reactive state using signals
  isLoading = signal(false);

  // Country and state data
  readonly countries = COUNTRIES;
  readonly nigerianStates = NIGERIAN_STATES;

  // The form is declared here
  profileForm!: FormGroup;
  genders: string[] = ['Male', 'Female', 'Other']; // Gender options


  // Signal for the country control's value.
  private countryValue = signal<string | null | undefined>(undefined);

  // Computed signals for UI logic
  showStateSelect = computed(() => this.countryValue() === 'Nigeria');
  showStateAutocomplete = computed(() => this.countryValue() !== 'Nigeria');
  filteredCountries = computed(() => {
    const filterValue = (this.countryValue() || '').toLowerCase();
    return this.countries.filter(country => country.toLowerCase().includes(filterValue));
  });

  readonly minDate = new Date(1900, 0, 1);
  readonly maxDate = new Date();

  constructor() {
    // We can use `effect` here because the constructor is an injection context.
    effect(() => {
      // Create the form here, where `this.user` is available
      const userData = this.user();
      if (userData) {
        // Corrected: Determine the initial state validators based on the initial country value.
        // This is the fix for the form being invalid from the start.
        const initialCountry = userData?.personalInfo?.address?.country || '';
        const stateValidators = initialCountry === 'Nigeria' ? [Validators.required, Validators.maxLength(50)] : [Validators.maxLength(50)];

        // check if user's account has email or not
        let isEmailSet: boolean;
        if (userData?.email) {
          isEmailSet = true
        } else {
          isEmailSet = false
        }

        this.profileForm = new FormGroup({
          displayName: new FormControl({ value: userData?.displayName, disabled: true }),
          gender: new FormControl(userData?.personalInfo.gender || '', [Validators.required]),
          email: new FormControl({ value: userData?.email, disabled: isEmailSet }, [Validators.email]),
          phone: new FormControl(userData?.personalInfo?.phone || '', [
            Validators.required,
            Validators.pattern(/^(\+?\d{1,3}[- ]?)?\d{6,14}$/)
          ]),
          street: new FormControl(userData?.personalInfo?.address?.street || '', [Validators.required, Validators.maxLength(100)]),
          city: new FormControl(userData?.personalInfo?.address?.city || '', [Validators.required, Validators.maxLength(50)]),
          // Apply the correct initial validators here
          state: new FormControl(userData?.personalInfo?.address?.state || '', stateValidators),
          country: new FormControl(initialCountry, [Validators.required, Validators.maxLength(50)]),
          biography: new FormControl(userData?.personalInfo?.biography || '', [Validators.maxLength(500)]),
          dob: new FormControl<Date | null>(userData?.personalInfo?.dob || null),
          userId: new FormControl(userData?._id)
        });

        // Use toSignal() within this effect's injection context
        this.countryValue.set(this.profileForm.controls['country'].value);
        this.profileForm.controls['country'].valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(value => {
            this.countryValue.set(value);
        });

        // Add a subscription to handle the state field's validation and status dynamically
        // after the form has been initialized.
        this.profileForm.controls['country'].valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(country => {
          const stateControl = this.profileForm.get('state');
          if (stateControl) {
            if (country === 'Nigeria') {
              // Set 'required' validator for Nigerian states
              stateControl.setValidators([Validators.required, Validators.maxLength(50)]);
              stateControl.enable(); // Ensure it's enabled for selection
            } else {
              // Clear 'required' validator for other countries
              stateControl.clearValidators();
              stateControl.setValue(''); // Clear the value for a new entry
              stateControl.enable(); // Ensure it's enabled for typing
            }
            stateControl.updateValueAndValidity();
          }
        });
      }
    }, { allowSignalWrites: true });
  }


  onAccountStatusChange(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.isLoading.set(true);
      const formData = {
        state: event.checked,
        userId: this.user()?._id
      };
    }
  }

  onSubmit(): void {
    // Check if the form is initialized before checking its validity
    if (!this.profileForm || this.profileForm.invalid) {
      if (this.profileForm) {
        this.profileForm.markAllAsTouched();
      }
      this.showNotification('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.profileForm.value;

      this.profileService.updateProfile(formValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.showNotification(response.message, 'success');
          this.isLoading.set(false);

          // reload user record
          this.userService.getUser(this.user()?.uid || '')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            error: (error) => {
              console.error('Failed to refresh user:', error);
            }
          });

        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
          this.isLoading.set(false);
        }
      })
  }

  private showNotification(message: string, panelClass: string = 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: [`snackbar-${panelClass}`]
    });
  }

  private handleError(error: HttpErrorResponse): void {
    const errorMessage = error.error?.message || 'Server error occurred, please try again.';
    this.showNotification(errorMessage);
  }
}
