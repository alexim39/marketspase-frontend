import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  signal,
  computed,
  DestroyRef,
  Signal,
  OnDestroy,
  effect
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../common/services/user.service';
import { UserInterface } from '@shared/services';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'async-professional-info',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush with signals for performance
  providers: [ProfileService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './professional.component.html',
  styleUrls: ['./professional.component.scss'],
})
export class ProfessionalInfoComponent implements OnInit, OnDestroy {
  // Services are injected via the `inject` function
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  // Input is a signal, which is a key part of the component's reactivity
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  // Component state is managed via signals
  public isLoading = signal<boolean>(false);
  private skillsSig = signal<string[]>([]);
  private hobbiesSig = signal<string[]>([]);
  private sellingPointsSig = signal<string[]>([]);

  // Computed signals provide a read-only, memoized view of the private signals
  public skills = computed(() => this.skillsSig());
  public hobbies = computed(() => this.hobbiesSig());
  public uniqueSellingPoints = computed(() => this.sellingPointsSig());
  public isMarketer = computed(() => this.user()?.role === 'marketer');

  // Use FormBuilder for a cleaner form group definition
  public professionalForm = this.fb.group({
    jobTitle: ['', [Validators.required, Validators.maxLength(50)]],
    profileHeadline: ['', [Validators.maxLength(160)]],
    certificate: ['', [Validators.required]],
    skills: [[] as string[], [Validators.required]],
    hobbies: [[] as string[], [Validators.required]],
    brandName: ['', [Validators.maxLength(120)]],
    brandSummary: ['', [Validators.maxLength(1000)]],
    uniqueSellingPoints: [[] as string[]],
    userId: [''],
  });

  public readonly educationOptions = [
    'Basic Education Certificate (Primary School)',
    'WASSCE',
    'NECO',
    'GCE',
    'ND',
    'HND',
    'B.Sc., B.A., B.Eng.',
    'M.Sc., M.A., M.B.A.',
    'Ph.D.',
    'NCE',
    'None',
  ];

  public readonly separatorKeysCodes = [ENTER, COMMA] as const;

  constructor() {
    effect(() => {
      this.initializeFormWithUserData();
    });
  }

  ngOnInit(): void {
    this.toggleMarketerControls(this.isMarketer());
  }

  
  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
  }


  private initializeFormWithUserData(): void {
    // Access the signal's value with the `()` syntax
    const userData = this.user();
    if (userData) {
      // Use patchValue to set form controls based on available data
      this.professionalForm.patchValue({
        jobTitle: userData.professionalInfo?.jobTitle || '',
        profileHeadline: userData.professionalInfo?.profileHeadline || '',
        certificate: userData.professionalInfo?.education?.certificate || '',
        brandName: userData.professionalInfo?.businessProfile?.brandName || '',
        brandSummary: userData.professionalInfo?.businessProfile?.brandSummary || '',
        userId: userData._id || '',
      }, { emitEvent: false });

      // Initialize the skills and hobbies signals with user data
      if (userData.professionalInfo?.skills) {
        this.skillsSig.set(userData.professionalInfo.skills);
      } else {
        this.skillsSig.set([]);
      }
      if (userData.interests?.hobbies) {
        this.hobbiesSig.set(userData.interests.hobbies);
      } else {
        this.hobbiesSig.set([]);
      }
      if (userData.professionalInfo?.businessProfile?.uniqueSellingPoints) {
        this.sellingPointsSig.set(userData.professionalInfo.businessProfile.uniqueSellingPoints);
      } else {
        this.sellingPointsSig.set([]);
      }
      // Update form controls with the new signal values
      this.professionalForm.get('skills')?.setValue(this.skillsSig());
      this.professionalForm.get('hobbies')?.setValue(this.hobbiesSig());
      this.professionalForm.get('uniqueSellingPoints')?.setValue(this.sellingPointsSig());
      this.toggleMarketerControls(userData.role === 'marketer');
    }
  }

  private toggleMarketerControls(isMarketer: boolean): void {
    const controls = ['brandName', 'brandSummary', 'uniqueSellingPoints'];
    for (const controlName of controls) {
      const control = this.professionalForm.get(controlName);
      if (!control) continue;
      if (isMarketer) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    }
  }

  onSubmit(): void {
    if (this.professionalForm.invalid) {
      this.professionalForm.markAllAsTouched();
      this.showNotification('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true); // Update the loading signal
    const professionalData = {
      ...this.professionalForm.getRawValue(),
      skills: this.skillsSig(),
      hobbies: this.hobbiesSig(),
      uniqueSellingPoints: this.sellingPointsSig(),
    };

    this.profileService.updateProfession(professionalData)
    .pipe(
      // The takeUntilDestroyed operator automatically handles unsubscription
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (response) => {
        this.showNotification(response.message, 'success');
        this.isLoading.set(false);

        // get update user record
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
      },
    });
  }

  private showNotification(message: string, panelClass: string = 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: [`snackbar-${panelClass}`],
    });
  }

  private handleError(error: HttpErrorResponse): void {
    const errorMessage = error.error?.message || 'Server error occurred, please try again.';
    this.showNotification(errorMessage);
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.skillsSig.update(currentSkills => [...currentSkills, value]);
      this.professionalForm.get('skills')?.setValue(this.skillsSig());
    }
    event.chipInput!.clear();
  }

  removeSkill(skill: string): void {
    this.skillsSig.update(currentSkills => currentSkills.filter(s => s !== skill));
    this.professionalForm.get('skills')?.setValue(this.skillsSig());
  }

  addHobby(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.hobbiesSig.update(currentHobbies => [...currentHobbies, value]);
      this.professionalForm.get('hobbies')?.setValue(this.hobbiesSig());
    }
    event.chipInput!.clear();
  }

  removeHobby(hobby: string): void {
    this.hobbiesSig.update(currentHobbies => currentHobbies.filter(h => h !== hobby));
    this.professionalForm.get('hobbies')?.setValue(this.hobbiesSig());
  }

  addSellingPoint(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.sellingPointsSig.update((current) => [...current, value]);
      this.professionalForm.get('uniqueSellingPoints')?.setValue(this.sellingPointsSig());
    }
    event.chipInput?.clear();
  }

  removeSellingPoint(point: string): void {
    this.sellingPointsSig.update((current) => current.filter((item) => item !== point));
    this.professionalForm.get('uniqueSellingPoints')?.setValue(this.sellingPointsSig());
  }
}
