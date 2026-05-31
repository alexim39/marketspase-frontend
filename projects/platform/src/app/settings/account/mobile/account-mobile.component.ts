import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { UserInterface } from '@shared/services';
import { UserService } from '../../../common/services/user.service';
import { PersonalInfoComponent } from '../personal/personal.component';
import { ProfessionalInfoComponent } from '../professional/professional.component';
import { UsernameInfoComponent } from '../username/username.component';

type AccountSectionId = 'personal' | 'professional' | 'identity';

interface AccountSection {
  id: AccountSectionId;
  icon: string;
  label: string;
  description: string;
}

@Component({
  selector: 'async-account-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PersonalInfoComponent,
    ProfessionalInfoComponent,
    UsernameInfoComponent,
  ],
  templateUrl: './account-mobile.component.html',
  styleUrls: ['./account-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMobileComponent {
  private readonly userService = inject(UserService);

  readonly user = this.userService.user;
  readonly activeSection = signal<AccountSectionId>('personal');

  readonly sections: AccountSection[] = [
    {
      id: 'personal',
      icon: 'person_outline',
      label: 'Personal',
      description: 'Name, email, phone, address, and account status',
    },
    {
      id: 'professional',
      icon: 'work_outline',
      label: 'Professional',
      description: 'Skills, interests, education, and brand profile',
    },
    {
      id: 'identity',
      icon: 'alternate_email',
      label: 'Identity',
      description: 'Username, social links, and referral profile',
    },
  ];

  readonly profileCompletion = computed(() => {
    const user = this.user();
    if (!user) return 0;

    const checks = [
      user.displayName,
      user.email,
      user.username,
      user.personalInfo?.phone,
      user.personalInfo?.gender,
      user.personalInfo?.address?.country,
      user.personalInfo?.address?.city,
      user.professionalInfo?.jobTitle,
      user.professionalInfo?.education?.certificate,
      user.professionalInfo?.skills?.length,
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  });

  readonly profileTone = computed<'good' | 'warn' | 'bad'>(() => {
    const completion = this.profileCompletion();
    if (completion >= 80) return 'good';
    if (completion >= 50) return 'warn';
    return 'bad';
  });

  readonly summaryStats = computed(() => {
    const user = this.user();
    return [
      {
        icon: 'verified_user',
        label: 'Status',
        value: user?.isActive ? 'Active' : 'Inactive',
        tone: user?.isActive ? 'good' : 'warn',
      },
      {
        icon: 'badge',
        label: 'Role',
        value: this.toTitle(user?.role || 'Member'),
        tone: 'neutral',
      },
      {
        icon: 'share',
        label: 'Socials',
        value: `${this.connectedProfilesCount(user)} linked`,
        tone: this.connectedProfilesCount(user) > 0 ? 'good' : 'warn',
      },
    ];
  });

  readonly nextBestAction = computed(() => {
    const user = this.user();
    if (!user?.personalInfo?.phone) return 'Add your WhatsApp phone number so buyers and promoters can reach you.';
    if (!user?.username) return 'Choose a public username to unlock cleaner profile and referral links.';
    if (!user?.professionalInfo?.jobTitle) return 'Add your professional profile so people understand what you do.';
    return 'Your profile is in good shape. Keep your public identity and links up to date.';
  });

  selectSection(section: AccountSectionId): void {
    this.activeSection.set(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sectionStatus(section: AccountSectionId): string {
    const user = this.user();
    if (!user) return 'Pending';

    if (section === 'personal') {
      return user.personalInfo?.phone && user.personalInfo?.address?.country ? 'Updated' : 'Needs info';
    }

    if (section === 'professional') {
      return user.professionalInfo?.jobTitle && user.professionalInfo?.skills?.length ? 'Updated' : 'Needs info';
    }

    return user.username ? 'Updated' : 'Needs info';
  }

  private connectedProfilesCount(user: UserInterface | null): number {
    const profiles = user?.professionalInfo?.socialProfiles;
    if (!profiles) return 0;

    return [
      profiles.website,
      profiles.instagram,
      profiles.tiktok,
      profiles.facebook,
      profiles.x,
      profiles.youtube,
      profiles.linkedin,
    ].filter(Boolean).length;
  }

  private toTitle(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
