
import { Component, inject, Input, Signal, effect, DestroyRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { COUNTRY_PHONE_MAP } from '../../../common/utils/country-phones';
import { ProfileService } from '../profile.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../common/services/user.service';

// google maps global
declare const google: any;
interface StructuredAddress {
  street: string;
  city: string;
  state: string;
  country: string;
}
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
export class PersonalInfoComponent implements AfterViewInit {

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  @ViewChild('streetInput', { static: false }) addressInput!: ElementRef<HTMLInputElement>;

  private snackBar = inject(MatSnackBar);
  private profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private userService = inject(UserService);

  isLoading = signal(false);

  readonly countries = COUNTRIES;
  readonly nigerianStates = NIGERIAN_STATES;

  profileForm!: FormGroup;
  genders: string[] = ['Male', 'Female', 'Other'];

  phoneCountries = COUNTRY_PHONE_MAP;
  filteredPhoneCountries = signal<any[]>(COUNTRY_PHONE_MAP);
  private allPhoneCountries = COUNTRY_PHONE_MAP;

  private countryValue = signal<string | null | undefined>(undefined);

  showStateSelect = computed(() => this.countryValue() === 'Nigeria');
  showStateAutocomplete = computed(() => this.countryValue() !== 'Nigeria');
  filteredCountries = computed(() => {
    const filterValue = (this.countryValue() || '').toLowerCase();
    return this.countries.filter(country => country.toLowerCase().includes(filterValue));
  });

  private readonly MIN_AGE = 18;
  isUnderAge = signal(false);

  readonly minDate = new Date(new Date().getFullYear() - 120, 0, 1);
  readonly maxDate = new Date();

  constructor() {
    effect(() => {
      const userData = this.user();
      if (!userData) return;

      // --- helpers for country-code resolution (unchanged) ---
      const normalizeCode = (code: string | number | null | undefined) =>
        (code == null ? '' : String(code)).replace(/[^\d]/g, '');

      const findCountryByIso2 = (iso?: string) => {
        const key = (iso || '').toLowerCase();
        return this.phoneCountries.find(c => c.iso2.toLowerCase() === key);
      };

      const findCountryByDialCode = (code?: string | number) => {
        const str = normalizeCode(code);
        return this.phoneCountries.find(c => normalizeCode(c.dialCode) === str);
      };

      let resolvedCountryCode = '234';
      let resolvedNationalNumber = '';

      const iso2 = userData?.personalInfo?.phoneDetails?.iso2;
      const isoCountry = findCountryByIso2(iso2);
      if (isoCountry) {
        resolvedCountryCode = normalizeCode(isoCountry.dialCode);
      } else {
        const detailsCode = userData?.personalInfo?.phoneDetails?.countryCode;
        if (detailsCode) {
          const byCode = findCountryByDialCode(detailsCode);
          resolvedCountryCode = byCode ? normalizeCode(byCode.dialCode) : normalizeCode(detailsCode);
        } else {
          const fullPhone = userData?.personalInfo?.phone || '';
          if (fullPhone.startsWith('+')) {
            const digits = fullPhone.replace(/[^\d]/g, '');
            for (let i = 4; i >= 1; i--) {
              const possible = digits.substring(0, i);
              const found = findCountryByDialCode(possible);
              if (found) {
                resolvedCountryCode = normalizeCode(found.dialCode);
                break;
              }
            }
          }
        }
      }

      const nationalFromDetails = userData?.personalInfo?.phoneDetails?.nationalNumber;
      if (nationalFromDetails) {
        resolvedNationalNumber = String(nationalFromDetails);
      } else {
        const full = userData?.personalInfo?.phone || '';
        if (full) {
          const digits = full.replace(/[^\d]/g, '');
          if (full.startsWith('+')) {
            if (digits.startsWith(resolvedCountryCode)) {
              resolvedNationalNumber = digits.substring(resolvedCountryCode.length);
            } else {
              for (let i = 4; i >= 1; i--) {
                const possible = digits.substring(0, i);
                const found = findCountryByDialCode(possible);
                if (found) {
                  resolvedNationalNumber = digits.substring(i);
                  break;
                }
              }
              if (!resolvedNationalNumber) resolvedNationalNumber = digits;
            }
          } else {
            resolvedNationalNumber = digits;
          }
        }
      }

      if (!['39', '46'].includes(resolvedCountryCode)) {
        resolvedNationalNumber = resolvedNationalNumber.replace(/^0+/, '');
      }

      const addressCountryName = userData?.personalInfo?.address?.country || '';
      if (!isoCountry && !userData?.personalInfo?.phoneDetails?.countryCode && !userData?.personalInfo?.phone?.startsWith('+')) {
        const byName = this.phoneCountries.find(
          c => c.name.toLowerCase() === addressCountryName.toLowerCase()
        );
        if (byName) {
          resolvedCountryCode = normalizeCode(byName.dialCode);
        }
      }

      const isEmailSet = !!userData?.email;

      this.profileForm = new FormGroup({
        displayName: new FormControl({ value: userData?.displayName, disabled: true }),
        gender: new FormControl(userData?.personalInfo.gender || '', [Validators.required]),
        email: new FormControl({ value: userData?.email, disabled: isEmailSet }, [Validators.email]),
        countryCode: new FormControl(normalizeCode(resolvedCountryCode), [Validators.required]),
        phone: new FormControl(resolvedNationalNumber, [
          Validators.required,
          Validators.pattern(/^[\d\+\s\-\(\)\.]+$/),
          Validators.minLength(5),
          Validators.maxLength(20)
        ]),
        street: new FormControl(userData?.personalInfo?.address?.street || '', [Validators.required, Validators.maxLength(100)]),
        city: new FormControl(userData?.personalInfo?.address?.city || '', [Validators.required, Validators.maxLength(50)]),
        state: new FormControl(
          userData?.personalInfo?.address?.state || '',
          (addressCountryName === 'Nigeria' ? [Validators.required, Validators.maxLength(50)] : [Validators.maxLength(50)])
        ),
        country: new FormControl(addressCountryName, [Validators.required, Validators.maxLength(50)]),
        biography: new FormControl(userData?.personalInfo?.biography || '', [Validators.maxLength(500)]),
        dob: new FormControl<Date | null>(userData?.personalInfo?.dob || null),
        userId: new FormControl(userData?._id)
      });

      this.countryValue.set(this.profileForm.controls['country'].value);

      this.profileForm.controls['country'].valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(value => {
          this.countryValue.set(value);
          if (value) {
            const countryData = this.phoneCountries.find(
              c => c.name.toLowerCase() === value.toLowerCase()
            );
            if (countryData) {
              this.profileForm.get('countryCode')?.setValue(normalizeCode(countryData.dialCode));
            }
          }
        });

      this.profileForm.controls['country'].valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(country => {
          const stateControl = this.profileForm.get('state');
          if (!stateControl) return;
          if (country === 'Nigeria') {
            stateControl.setValidators([Validators.required, Validators.maxLength(50)]);
            stateControl.enable();
          } else {
            stateControl.clearValidators();
            stateControl.setValue('');
            stateControl.enable();
          }
          stateControl.updateValueAndValidity();
        });

      if (userData?.personalInfo?.dob) {
        const dobDate = new Date(userData.personalInfo.dob);
        if (this.isValidDate(dobDate)) {
          this.isUnderAge.set(this.calculateAge(dobDate) < this.MIN_AGE);
        }
      }

      this.profileForm.controls['dob'].valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(dob => {
          if (dob) {
            const dobDate = new Date(dob);
            if (this.isValidDate(dobDate)) {
              this.isUnderAge.set(this.calculateAge(dobDate) < this.MIN_AGE);
            } else {
              this.isUnderAge.set(false);
            }
          } else {
            this.isUnderAge.set(false);
          }
        });
    }, { allowSignalWrites: true });
  }

  getSelectedCountryEmoji(): string {
    const code = this.profileForm?.get('countryCode')?.value;
    const country = this.phoneCountries.find(c => c.dialCode.toString() === String(code));
    return country?.emoji || '';
  }

  getSelectedCountryName(): string {
    const code = this.profileForm?.get('countryCode')?.value;
    const country = this.phoneCountries.find(c => c.dialCode.toString() === String(code));
    return country?.name || '';
  }

  // Filter countries for dropdown (unchanged)
  filterCountries(searchTerm: string) {
    if (!searchTerm) {
      this.filteredPhoneCountries.set(this.allPhoneCountries);
      return;
    }
    const filtered = this.allPhoneCountries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm) ||
      country.iso2.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.filteredPhoneCountries.set(filtered);
  }

  // Display helper (unchanged)
  getFullPhoneNumber(): string {
    const countryCode = this.profileForm?.get('countryCode')?.value;
    const phoneNumber = this.profileForm?.get('phone')?.value;
    if (countryCode && phoneNumber) {
      return `+${countryCode}${this.cleanPhoneNumber(phoneNumber)}`;
    }
    return '';
  }

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  ngAfterViewInit(): void {
    if (this.addressInput) {
      this.initAddressAutocomplete();
    }
  }

  initAddressAutocomplete(): void {
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(
        this.addressInput.nativeElement,
        { types: ['address'], fields: ['address_components', 'geometry', 'name'] }
      );
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        this.handlePlaceSelection(place);
      });
    } else {
      console.warn('Google Maps API or Places library not loaded. Address Autocomplete will not be available.');
    }
  }

  handlePlaceSelection(place: any): void {
    if (!place || !place.address_components) return;

    const componentMap: { [key: string]: keyof StructuredAddress } = {
      locality: 'city',
      administrative_area_level_1: 'state',
      country: 'country',
    };

    const address: StructuredAddress = { street: '', city: '', state: '', country: '' };
    let streetNumber = '';
    let route = '';

    for (const component of place.address_components) {
      const type = component.types[0];
      if (type === 'street_number') streetNumber = component.long_name;
      else if (type === 'route') route = component.long_name;
      else if (componentMap[type]) address[componentMap[type]] = component.long_name;
    }

    address.street = (streetNumber + ' ' + route).trim();

    this.profileForm.patchValue({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country
    });

    // const countryData = this.phoneCountries.find(c => c.name.toLowerCase() === address.country.toLowerCase());
    // if (countryData) {
    //   this.profileForm.get('countryCode')?.setValue(countryData.dialCode);
    // }

    

const countryData = this.phoneCountries.find(
  c => c.name.toLowerCase() === address.country.toLowerCase()
);
if (countryData) {
  const normalized = (code: string | number | null | undefined) =>
    (code == null ? '' : String(code)).replace(/[^\d]/g, '');
  this.profileForm.get('countryCode')?.setValue(normalized(countryData.dialCode));
}



    if (!address.street) {
      this.profileForm.get('street')?.setValue(place.name || '');
    }
  }

  onAccountStatusChange(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.isLoading.set(true);
      const formData = {
        state: event.checked,
        userId: this.user()?._id
      };
      // ... activation logic
    }
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  showAgeRestrictionWarning(): void {
    const dobControl = this.profileForm.get('dob');
    if (dobControl?.value) {
      const dobDate = new Date(dobControl.value);
      if (this.isValidDate(dobDate)) {
        const age = this.calculateAge(dobDate);
        this.isUnderAge.set(age < this.MIN_AGE);
      } else {
        this.isUnderAge.set(false);
      }
    }
  }

  /** -----------------------------
   * Phone normalization (client-side, NG only)
   * Mirrors the server’s normalizeNgPhone behavior.
   * ----------------------------- */
  private normalizeNgPhoneClient(raw: string | number | null | undefined): string | null {
    if (raw === undefined || raw === null) return null;
    const s = String(raw).trim();
    if (!s) return null;

    // remove non-digits
    let digits = s.replace(/\D/g, '');

    // Drop leading '0' for local 11-digit formats (080..., 090..., etc.)
    if (digits.startsWith('0')) {
      digits = digits.slice(1); // now 10 digits if input was 11
    }

    // If already starts with 234, it must be 13 digits total (234 + 10)
    if (digits.startsWith('234')) {
      if (digits.length !== 13) return null;
      return digits; // canonical
    }

    // If we now have 10 digits, treat as local NG mobile and prefix '234'
    if (digits.length === 10) {
      return `234${digits}`;
    }

    // Any other length/case is invalid for current NG-only backend
    return null;
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



  /** -----------------------------
   * Submit: let backend normalize for any country
   * ----------------------------- */
  onSubmit(): void {
    if (!this.profileForm || this.profileForm.invalid) {
      if (this.profileForm) this.profileForm.markAllAsTouched();
      this.showNotification('Please fill all required fields correctly');
      return;
    }

    // Age validation (unchanged)
    const dob = this.profileForm.get('dob')?.value;
    if (dob) {
      const dobDate = new Date(dob);
      if (!this.isValidDate(dobDate)) {
        this.showNotification('Invalid date of birth', 'error');
        return;
      }
      const age = this.calculateAge(dobDate);
      if (age < this.MIN_AGE) {
        this.showNotification(`You must be at least ${this.MIN_AGE} years old to update your profile`, 'warning');
        this.isUnderAge.set(true);
        return;
      }
      this.isUnderAge.set(false);
    }

    this.isLoading.set(true);
    const formValue = this.profileForm.value;

    // Resolve selected country by current countryCode control
    const selectedCountry = this.phoneCountries.find(
      c => String(c.dialCode) === String(formValue.countryCode)
    );

    // Raw phone as entered; backend will parse/validate this
    const rawPhoneInput = (formValue.phone ?? '').toString().trim();

    // Build payload; DO NOT pre-normalize for NG here
    const payload: any = {
      ...formValue,
      phone: rawPhoneInput,
      phoneDetails: {
        countryCode: selectedCountry ? String(selectedCountry.dialCode) : undefined,
        iso2: selectedCountry ? selectedCountry.iso2.toUpperCase() : undefined
        // nationalNumber/fullNumber left for backend to compute
      }
    };

    // Remove countryCode from top level (you keep this convention)
    delete payload.countryCode;

    this.profileService.updateProfile(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.showNotification(response.message, 'success');
          this.isLoading.set(false);

          this.userService.getUser(this.user()?.uid || '')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              error: (error) => console.error('Failed to refresh user:', error)
            });
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
          this.isLoading.set(false);
        }
      });
  }


}
