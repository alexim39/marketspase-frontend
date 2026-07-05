import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpParams } from '@angular/common/http';
import { FeedService } from '../../community/feeds/feed.service';
import { FeedPostCardComponent } from '../../community/feeds/feed-post-card/feed-post-card.component';
import { UserService } from '../../common/services/user.service';
import { EngagementService } from '../engagement.service';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-promoter-engagement-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, FeedPostCardComponent],
  templateUrl: './promoter-engagement-feed.component.html',
  styleUrls: ['./promoter-engagement-feed.component.scss']
})
export class PromoterEngagementFeedComponent implements OnInit {
  private feedService = inject(FeedService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private userService = inject(UserService);
  private engagementService = inject(EngagementService);

  user = this.userService.user;
  posts = signal<any[]>([]);
  loading = signal(true);
  platformFilter = signal('');
  likedPosts = signal<Set<string>>(new Set());
  savedPosts = signal<Set<string>>(new Set());
  activeContractCount = signal(0);
  todayEngagements = signal(0);
  page = 1;

  filteredPosts = computed(() => {
    const f = this.platformFilter();
    if (!f) return this.posts();
    return this.posts().filter(p => p.socialPlatform === f);
  });

  hasMore = computed(() => this.posts().length >= this.page * 10);

  ngOnInit(): void {
    this.loadPosts(true);
    this.loadContractCount();
  }

  loadPosts(reset: boolean): void {
    if (reset) { this.page = 1; this.posts.set([]); }
    this.loading.set(true);

    this.api.get<any>('api/v1/feeds/list', new HttpParams().set('page', this.page).set('limit', '10'), undefined, true).subscribe({
      next: (r: any) => {
        const newPosts = (r?.data || r?.posts || []).filter((p: any) =>
          p.source === 'manual' || p.socialPlatform || p.campaign || p.isBoosted
        );
        this.posts.update(prev => reset ? newPosts : [...prev, ...newPosts]);
        this.page++;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadContractCount(): void {
    this.engagementService.listContracts('promoter').subscribe({
      next: (r: any) => {
        const contracts = r?.data || [];
        this.activeContractCount.set(contracts.filter((c: any) => c.status === 'active').length);
      }
    });
  }

  onEngage(post: any, type: string): void {
    if (!post?._id) return;

    if (type === 'like') {
      this.api.post(`api/v1/feeds/${post._id}/like`, {}, undefined, true).subscribe(() => {
        const set = new Set(this.likedPosts());
        if (set.has(post._id)) { set.delete(post._id); } else { set.add(post._id); }
        this.likedPosts.set(set);
        this.trackEngagement(post, type);
      });
    } else if (type === 'save') {
      this.api.post(`api/v1/feeds/${post._id}/save`, {}, undefined, true).subscribe(() => {
        const set = new Set(this.savedPosts());
        if (set.has(post._id)) { set.delete(post._id); } else { set.add(post._id); }
        this.savedPosts.set(set);
      });
    } else if (type === 'share') {
      this.api.post(`api/v1/feeds/${post._id}/share`, { platform: 'internal' }, undefined, true).subscribe(() => {
        this.trackEngagement(post, type);
        this.snack.open('Post shared!', 'OK', { duration: 1500 });
      });
    } else if (type === 'comment') {
      const comment = prompt('Write a meaningful comment:');
      if (comment?.trim()) {
        this.api.post(`api/v1/feeds/${post._id}/comments`, { content: comment.trim() }, undefined, true).subscribe(() => {
          this.trackEngagement(post, type);
          this.snack.open('Comment posted!', 'OK', { duration: 1500 });
        });
      }
    }
  }

  private trackEngagement(post: any, type: string): void {
    this.todayEngagements.update(v => v + 1);
    // Auto-track toward active contracts
    this.engagementService.listContracts('promoter').subscribe({
      next: (r: any) => {
        const contracts = (r?.data || []).filter((c: any) =>
          c.status === 'active' && c.marketerId?._id === (post.author?._id || post.author)
        );
        for (const contract of contracts) {
          const taskIndex = contract.tasks?.findIndex((t: any) => t.type === type);
          if (taskIndex >= 0) {
            const task = contract.tasks[taskIndex];
            if (task.completed < task.target) {
              this.engagementService.updateTaskProgress(contract._id, taskIndex, task.completed + 1).subscribe();
            }
          }
        }
      }
    });
  }
}
