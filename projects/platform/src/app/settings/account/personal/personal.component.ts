import { ChangeDetectorRef, Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
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
import { startWith, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { SettingsService } from '../../settings.service';
import { UserInterface } from '../../../common/services/user.service';
import { ProfileImageUploaderComponent } from '../profile-image.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DAVIDO_FAN_COUNTRIES } from '../../../common/utils/countries';


// Nigerian states
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi',
  'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe',
  'Zamfara', 'Federal Capital Territory'
];

@Component({
  selector: 'async-personal-infor',
  providers: [SettingsService],
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
    ProfileImageUploaderComponent,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatAutocompleteModule
  ],
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalInfoComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private snackBar = inject(MatSnackBar);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  @Input() user!: UserInterface;
  profileForm!: FormGroup;

  // Country and state data
  countries = DAVIDO_FAN_COUNTRIES;
  nigerianStates = NIGERIAN_STATES;
  filteredCountries: string[] = [];
  showStateAutocomplete = false;
  showStateSelect = false;

  minDate = new Date(1900, 0, 1);
  maxDate = new Date();
  isLoading = false;

  ngOnInit(): void {
    this.initializeForm();
    this.maxDate = new Date();
    this.filteredCountries = this.countries;
    
    // Set up the country filter subscription
    this.setupCountryFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && !changes['user'].firstChange) {
      this.updateFormWithUserData();
    }
  }

  private setupCountryFilter(): void {
    this.profileForm.get('country')?.valueChanges.pipe(
      // You could add debounceTime here if you want to delay the filtering
      // debounceTime(300),
      startWith('') // Start with empty string to show all countries
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.filterCountries(value);
      }
    });
  }

  filterCountries(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredCountries = this.countries.filter(country => 
      country.toLowerCase().includes(filterValue)
    );
  }

  private initializeForm(): void {
    this.profileForm = new FormGroup({
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      lastname: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      email: new FormControl(
        { value: '', disabled: true }, 
        [Validators.required, Validators.email]
      ),
      phone: new FormControl(this.user?.personalInfo?.phone || '', [
        Validators.required,
        Validators.pattern(/^(\+?\d{1,3}[- ]?)?\d{6,14}$/)
      ]),
      street: new FormControl('', [
        Validators.required,
        Validators.maxLength(100)
      ]),
      city: new FormControl('', [
        Validators.required,
        Validators.maxLength(50)
      ]),
      state: new FormControl(this.user?.personalInfo?.address?.state, [
        Validators.required,
        Validators.maxLength(50)
      ]),
      country: new FormControl('', [
        Validators.required,
        Validators.maxLength(50)
      ]),
      bio: new FormControl('', [
        Validators.maxLength(500)
      ]),
      dob: new FormControl(null),
      userId: new FormControl('')
    });

    // Watch country changes to handle state field appropriately
    this.profileForm.get('country')?.valueChanges.subscribe(country => {
      this.handleCountryChange(country);
    });

    // Update form if user data is already available
    if (this.user) {
      this.updateFormWithUserData();
    }
  }

  private handleCountryChange(country: string): void {
    if (country === 'Nigeria') {
      this.showStateSelect = true;
      this.showStateAutocomplete = false;
      // Reset state value when switching to Nigeria
      this.profileForm.get('state')?.setValue('');
    } else {
      this.showStateSelect = false;
      this.showStateAutocomplete = true;
    }
  }

  private updateFormWithUserData(): void {
    const userCountry = this.user?.personalInfo?.address?.country || '';
    
    this.profileForm.patchValue({
      name: this.user?.name || '',
      lastname: this.user?.lastname || '',
      email: this.user?.email || '',
      phone: this.user?.personalInfo?.phone || '',
      street: this.user?.personalInfo?.address?.street || '',
      city: this.user?.personalInfo?.address?.city || '',
      state: this.user?.personalInfo?.address?.state || '',
      country: userCountry,
      bio: this.user?.personalInfo?.bio || '',
      dob: this.user?.personalInfo?.dob || null,
      userId: this.user?._id || ''
    });

    // Handle the state field based on the country
    this.handleCountryChange(userCountry);
    this.cdr.markForCheck();
  }

  onAccountStatusChange(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.isLoading = true;
      const formData = {
        state: event.checked,
        partnerId: this.user._id 
      };

      this.subscriptions.push(
        this.settingsService.activateAccount(formData).subscribe({
          next: (response) => {
            this.showNotification(response.message);
            this.isLoading = false;
          },
          error: (error: HttpErrorResponse) => {
            this.handleError(error);
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        })
      );
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.showNotification('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;
    const formValue = this.profileForm.value;
    
    this.subscriptions.push(
      this.settingsService.updateProfile(formValue).subscribe({
        next: (response) => {
          this.showNotification(response.message, 'success');
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      })
    );
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}