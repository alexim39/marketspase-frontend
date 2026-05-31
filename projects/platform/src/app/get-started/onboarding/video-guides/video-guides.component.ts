import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { SwitchUserRoleService } from '../../../common/services/switch-user-role.service';

export interface VideoGuideItem {
  id: string;
  role: 'marketer' | 'promoter';
  title: string;
  description: string;
  startsAt: string;
  url: SafeResourceUrl;
}

@Component({
  selector: 'marketspase-video-guides',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './video-guides.component.html',
  styleUrls: ['./video-guides.component.scss']
})
export class VideoGuidesComponent {
  @Input() isMarketer: boolean = false;
  @Input() isPromoter: boolean = false;
  @Input() marketerVideoUrl: SafeResourceUrl | null = null;
  @Input() promoterVideoUrl: SafeResourceUrl | null = null;
  @Input() marketerVideos: VideoGuideItem[] = [];
  @Input() promoterVideos: VideoGuideItem[] = [];

  private switchUserRoleService = inject(SwitchUserRoleService);

  get marketerGuideItems(): VideoGuideItem[] {
    if (this.marketerVideos.length) return this.marketerVideos;
    if (!this.marketerVideoUrl) return [];
    return [
      {
        id: 'marketer-guide',
        role: 'marketer',
        title: 'Marketer guide',
        description: 'Learn how to create effective campaigns, set budgets, and track performance.',
        startsAt: 'Start',
        url: this.marketerVideoUrl
      }
    ];
  }

  get promoterGuideItems(): VideoGuideItem[] {
    if (this.promoterVideos.length) return this.promoterVideos;
    if (!this.promoterVideoUrl) return [];
    return [
      {
        id: 'promoter-guide',
        role: 'promoter',
        title: 'Promoter guide',
        description: 'Learn how to share campaigns, maximize earnings, and get paid safely.',
        startsAt: 'Start',
        url: this.promoterVideoUrl
      }
    ];
  }

  switchUserRole(role: string) {
    // 6. Broadcast the signal to switch user role on sidenav.component
    this.switchUserRoleService.sendSwitchRequest(role);
  }
}
