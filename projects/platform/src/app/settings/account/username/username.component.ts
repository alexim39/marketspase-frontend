import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  Signal,
  computed,
  effect,
  inject,
  signal,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserInterface } from '@shared/services';
import { UserService } from '../../../common/services/user.service';
import { ProfileService } from '../profile.service';
import { UsernameDialogComponent } from './help-dialog.component';
import { RESTRICTEDWORDS } from './restricted-words';

interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
  pendingReferrals: number;
  paidReferrals: number;
  referralLink: string;
  estimatedEarnings: number;
}

interface ReferralStatsResponse {
  success: boolean;
  data: ReferralStats;
  message?: string;
}

const usernameRestrictedWordValidator = (control: AbstractControl<string | null>): ValidationErrors | null => {
  const value = (control.value || '').trim().toLowerCase();
  if (!value) {
    return null;
  }

  return RESTRICTEDWORDS.includes(value) ? { restrictedWord: true } : null;
};

@Component({
  selector: 'async-username-info',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.scss'],
})
export class UsernameInfoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  readonly isLoading = signal(false);
  readonly referralStats = signal<ReferralStats | null>(null);

  readonly usernameForm = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
        usernameRestrictedWordValidator,
      ],
    ],
    website: ['', [Validators.maxLength(300)]],
    instagram: ['', [Validators.maxLength(160)]],
    tiktok: ['', [Validators.maxLength(160)]],
    facebook: ['', [Validators.maxLength(160)]],
    x: ['', [Validators.maxLength(160)]],
    youtube: ['', [Validators.maxLength(160)]],
    linkedin: ['', [Validators.maxLength(160)]],
  });

  readonly username = computed(() => {
    const current = this.usernameForm.controls.username.value.trim();
    return current || this.user()?.username || 'your-username';
  });

  readonly connectedProfilesCount = computed(() => {
    const values = this.usernameForm.getRawValue();
    return ['website', 'instagram', 'tiktok', 'facebook', 'x', 'youtube', 'linkedin']
      .map((key) => values[key as keyof typeof values])
      .filter((value) => String(value || '').trim().length > 0).length;
  });

  private hydratedSignature = '';
  private lastLoadedReferralUserId: string | null = null;

  ngOnInit(): void {
    effect(() => {
      const user = this.user();
      if (!user?._id) {
        this.referralStats.set(null);
        this.lastLoadedReferralUserId = null;
        this.hydratedSignature = '';
        return;
      }

      const nextSignature = JSON.stringify({
        username: user.username || '',
        website: user.professionalInfo?.socialProfiles?.website || '',
        instagram: user.professionalInfo?.socialProfiles?.instagram || '',
        tiktok: user.professionalInfo?.socialProfiles?.tiktok || '',
        facebook: user.professionalInfo?.socialProfiles?.facebook || '',
        x: user.professionalInfo?.socialProfiles?.x || '',
        youtube: user.professionalInfo?.socialProfiles?.youtube || '',
        linkedin: user.professionalInfo?.socialProfiles?.linkedin || '',
      });

      if (nextSignature !== this.hydratedSignature) {
        this.hydratedSignature = nextSignature;
        this.usernameForm.reset(
          {
            username: user.username || '',
            website: user.professionalInfo?.socialProfiles?.website || '',
            instagram: user.professionalInfo?.socialProfiles?.instagram || '',
            tiktok: user.professionalInfo?.socialProfiles?.tiktok || '',
            facebook: user.professionalInfo?.socialProfiles?.facebook || '',
            x: user.professionalInfo?.socialProfiles?.x || '',
            youtube: user.professionalInfo?.socialProfiles?.youtube || '',
            linkedin: user.professionalInfo?.socialProfiles?.linkedin || '',
          },
          { emitEvent: false },
        );
      }

      if (this.lastLoadedReferralUserId !== user._id) {
        this.lastLoadedReferralUserId = user._id;
        this.loadReferralStats(user._id);
      }
    }, { injector: this.injector });
  }

  onSubmit(): void {
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.showNotification('Please fix the highlighted fields before saving.');
      return;
    }

    const currentUser = this.user();
    if (!currentUser?._id || !currentUser?.uid) {
      this.showNotification('We could not identify your account. Please refresh and try again.');
      return;
    }

    const formValue = this.usernameForm.getRawValue();
    const payload = {
      username: formValue.username.trim(),
      website: formValue.website.trim(),
      instagram: formValue.instagram.trim(),
      tiktok: formValue.tiktok.trim(),
      facebook: formValue.facebook.trim(),
      x: formValue.x.trim(),
      youtube: formValue.youtube.trim(),
      linkedin: formValue.linkedin.trim(),
    };

    this.isLoading.set(true);
    this.profileService.updatePublicIdentity(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.showNotification(response?.message || 'Public identity updated successfully.', 'success');
          this.userService.getUser(currentUser.uid)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                if (currentUser._id) {
                  this.loadReferralStats(currentUser._id);
                }
              },
              error: (error) => {
                console.error('Failed to refresh user profile after public identity update:', error);
              },
            });
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
          this.isLoading.set(false);
        },
      });
  }

  showHelp(): void {
    this.dialog.open(UsernameDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: {
        title: 'Public identity tips',
        content: `
          <p>Your username becomes part of your public MarketSpase profile, store link, and referral URL.</p>
          <ul>
            <li>Use <strong>3-30 characters</strong>.</li>
            <li>Only <strong>letters, numbers, and underscores</strong> are allowed.</li>
            <li>Keep it memorable so buyers, promoters, and collaborators can find you easily.</li>
            <li>Add your social links here so your profile feels complete and trustworthy.</li>
          </ul>
        `,
      },
    });
  }

  copyReferralLink(): void {
    const link = this.referralStats()?.referralLink;
    if (!link) {
      return;
    }

    this.profileService.copyReferralLink(link)
      .then(() => this.showNotification('Referral link copied to clipboard.', 'success'))
      .catch(() => this.showNotification('Unable to copy the referral link right now.'));
  }

  shareOnWhatsApp(): void {
    const stats = this.referralStats();
    if (!stats?.referralLink) {
      return;
    }

    const shareMessage = `Join me on MarketSpase and start growing with smarter social marketing. Use my link: ${stats.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer');
  }

  shareOnFacebook(): void {
    const link = this.referralStats()?.referralLink;
    if (!link) {
      return;
    }

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  private loadReferralStats(userId: string): void {
    this.profileService.getReferralStats(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ReferralStatsResponse) => {
          this.referralStats.set(response?.data || null);
        },
        error: (error) => {
          console.error('Failed to load referral statistics:', error);
          this.referralStats.set(null);
        },
      });
  }

  private showNotification(message: string, panelClass: 'success' | 'error' | 'info' = 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4500,
      panelClass: [`snackbar-${panelClass}`],
    });
  }

  private handleError(error: HttpErrorResponse): void {
    const message = error.error?.message || 'We could not update your public identity right now.';
    this.showNotification(message);
  }
}
