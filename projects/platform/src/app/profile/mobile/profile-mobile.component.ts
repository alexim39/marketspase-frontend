import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { FeedPostCardComponent } from '../../community/feeds/feed-post-card/feed-post-card.component';
import { FeedService } from '../../community/feeds/feed.service';
import { ProfileSkeletonComponent } from '../components/profile-skeleton.component';
import { ProfileService } from '../services/profile.service';
import { ProfilePageComponent } from '../profile-page.component';

type ProfileMobileSection = 'overview' | 'posts' | 'network' | 'badges';

@Component({
  selector: 'app-profile-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    FeedPostCardComponent,
    ProfileSkeletonComponent,
  ],
  providers: [ProfileService, FeedService],
  templateUrl: './profile-mobile.component.html',
  styleUrls: ['./profile-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMobileComponent extends ProfilePageComponent {
  readonly activeMobileSection = signal<ProfileMobileSection>('overview');

  readonly profileLocation = computed(() => {
    const address = this.profile()?.personalInfo?.address;
    const city = address?.city?.trim();
    const country = address?.country?.trim();
    return [city, country].filter(Boolean).join(', ');
  });

  readonly mobileStats = computed(() => {
    const profile = this.profile();
    const badges = this.badgeLevelSummary();

    return [
      {
        label: 'Posts',
        value: profile?.postsCount || 0,
        icon: 'dynamic_feed',
        section: 'posts' as ProfileMobileSection,
      },
      {
        label: 'Followers',
        value: profile?.followersCount || 0,
        icon: 'groups',
        section: 'network' as ProfileMobileSection,
      },
      {
        label: 'Following',
        value: profile?.followingCount || 0,
        icon: 'person_add',
        section: 'network' as ProfileMobileSection,
      },
      {
        label: 'Badges',
        value: badges?.badgesEarned || 0,
        icon: 'workspace_premium',
        section: 'badges' as ProfileMobileSection,
      },
    ];
  });

  readonly mobileSections = [
    {
      id: 'overview' as ProfileMobileSection,
      icon: 'person',
      label: 'Overview',
    },
    {
      id: 'posts' as ProfileMobileSection,
      icon: 'dynamic_feed',
      label: 'Posts',
    },
    {
      id: 'network' as ProfileMobileSection,
      icon: 'groups',
      label: 'Network',
    },
    {
      id: 'badges' as ProfileMobileSection,
      icon: 'workspace_premium',
      label: 'Badges',
    },
  ];

  readonly primaryActionLabel = computed(() => {
    const profile = this.profile();
    if (!profile) return 'Profile';
    if (profile.isOwnProfile) return 'Edit profile';
    return profile.isFollowing ? 'Following' : 'Follow';
  });

  readonly primaryActionIcon = computed(() => {
    const profile = this.profile();
    if (!profile) return 'person';
    if (profile.isOwnProfile) return 'edit';
    return profile.isFollowing ? 'check' : 'person_add';
  });

  readonly levelProgress = computed(() => {
    const summary = this.badgeLevelSummary() as { progressPercent?: number } | null;
    return Number(summary?.progressPercent || 0);
  });

  selectMobileSection(section: ProfileMobileSection): void {
    this.activeMobileSection.set(section);

    if (section === 'posts') {
      this.activeTabIndex.set(0);
    } else if (section === 'network') {
      this.activeTabIndex.set(1);
    } else if (section === 'badges') {
      this.activeTabIndex.set(3);
    }
  }

  openPrimaryAction(): void {
    const profile = this.profile();
    if (!profile) return;

    if (profile.isOwnProfile) {
      this.editProfile();
      return;
    }

    this.toggleFollow();
  }
}
