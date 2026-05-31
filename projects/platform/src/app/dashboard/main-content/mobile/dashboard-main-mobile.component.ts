import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../../profile/services/profile.service';
import { TutorialService } from '../../../tutorials/services/tutorial.service';
import { FeedService } from '../../../community/feeds/feed.service';
import { ForumService } from '../../../community/forum/forum.service';
import { DashboardService } from '../../dashboard.service';
import { Activity } from '../components/recent-activity/recent-activity.component';
import { DashboardMainContainer } from '../main-content.component';
import { GeneralMsgNotifierBannerComponent } from '../notification-banner/general-msg-notifier/general-msg-notifier-banner.component';
import { ProfileNotifierBannerComponent } from '../notification-banner/profiile-notifier/profile-notifier-banner.component';
import { PromoBannerComponent } from '../notification-banner/promo/promo-banner.component';

@Component({
  selector: 'app-dashboard-main-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ProfileNotifierBannerComponent,
    PromoBannerComponent,
    GeneralMsgNotifierBannerComponent,
  ],
  providers: [DashboardService, FeedService, ForumService, ProfileService, TutorialService],
  templateUrl: './dashboard-main-mobile.component.html',
  styleUrls: ['./dashboard-main-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMainMobileComponent extends DashboardMainContainer {
  readonly displayName = computed(() => {
    const user = this.user() as any;
    return user?.firstName || user?.displayName || user?.username || 'there';
  });

  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    if (role === 'marketer') return 'Marketer';
    if (role === 'promoter') return 'Promoter';
    if (role === 'admin') return 'Admin';
    return 'MarketSpase';
  });

  readonly heroStat = computed(() => this.dashboardStats()[0] ?? null);
  readonly mobileStats = computed(() => this.dashboardStats().slice(0, 4));
  readonly mobileActivities = computed(() => this.recentActivity().slice(0, 4));
  readonly mobileTrends = computed(() => this.trendingItems().slice(0, 4));
  readonly mobileConnections = computed(() => this.suggestedConnections().slice(0, 3));
  readonly mobileCourses = computed(() => this.learningCourses().slice(0, 3));

  readonly streakLabel = computed(() => {
    const streak = this.user()?.loginStreak?.currentStreak || 0;
    return `${streak} day${streak === 1 ? '' : 's'}`;
  });

  readonly levelLabel = computed(() => {
    const level = this.user()?.gamificationProfile?.currentLevel || 1;
    return `Level ${level}`;
  });

  readonly primaryActionLabel = computed(() =>
    this.user()?.role === 'marketer' ? 'Create campaign' : 'Find campaigns'
  );

  readonly secondaryActionLabel = computed(() =>
    this.user()?.role === 'marketer' ? 'Campaigns' : 'My promotions'
  );

  triggerPrimaryAction(): void {
    if (this.user()?.role === 'marketer') {
      this.createCampaign();
      return;
    }

    this.browseCampaign();
  }

  triggerSecondaryAction(): void {
    if (this.user()?.role === 'marketer') {
      this.viewCampaigns();
      return;
    }

    this.viewPromotions();
  }

  trackActivity(activity: Activity): void {
    this.onActivityClick(activity);
  }
}
