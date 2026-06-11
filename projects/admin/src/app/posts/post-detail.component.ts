import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, switchMap } from 'rxjs';
import { PostService, AdminPostDetail } from './post.service';

@Component({
  selector: 'app-admin-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressBarModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss']
})
export class AdminPostDetailComponent {
  private readonly postService = inject(PostService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly post = signal<AdminPostDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly featureLoading = signal(false);

  readonly postId = signal<string>('');

  readonly engagementSummary = computed(() => {
    const p = this.post();
    if (!p) return { total: 0, breakdown: '' };
    const total = p.likeCount + p.commentCount + p.shareCount + (p.chatCount || 0);
    return {
      total,
      breakdown: `${p.likeCount} likes · ${p.commentCount} comments · ${p.shareCount} shares`
    };
  });

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const id = params.get('postId') || '';
          this.postId.set(id);
          this.loading.set(true);
          this.error.set(null);
          return this.postService.getPostDetail(id).pipe(
            finalize(() => this.loading.set(false))
          );
        })
      )
      .subscribe({
        next: (postData) => {
          this.post.set(postData);
        },
        error: (err) => {
          console.error('Failed to load post detail:', err);
          this.error.set('Failed to load post details.');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/posts']);
  }

  toggleFeature(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const newFeatured = !currentPost.isFeatured;
    this.featureLoading.set(true);

    this.postService.toggleFeature(currentPost._id, newFeatured, 7)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.featureLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.post.update((p) =>
            p ? {
              ...p,
              isFeatured: response.isFeatured,
              featuredUntil: response.featuredUntil || null
            } : p
          );
        },
        error: (err) => {
          console.error('Failed to toggle feature:', err);
        }
      });
  }

  archivePost(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const confirmed = window.confirm(
      'Archive this post? It will no longer be visible in the public feed.'
    );
    if (!confirmed) return;

    this.postService.deletePost(currentPost._id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard/posts']);
        },
        error: (err) => {
          console.error('Failed to archive post:', err);
        }
      });
  }
  getStatusClass(status: string): string {
    return status || 'unknown';
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      story: 'article',
      campaign: 'campaign',
      product: 'sell',
      challenge: 'emoji_events',
      earnings: 'trending_up',
      tip: 'lightbulb',
      achievement: 'stars',
      milestone: 'flag'
    };
    return icons[type] || 'post_add';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /** Helper to safely access index-signature properties in templates */
  getSetting(key: string): any {
    const p = this.post();
    if (!p || !p.settings || typeof p.settings !== 'object') return undefined;
    return (p.settings as any)[key];
  }

  getSocialMetric(key: string): number {
    const p = this.post();
    if (!p || !p.socialMetrics || typeof p.socialMetrics !== 'object') return 0;
    return (p.socialMetrics as any)[key] || 0;
  }

  getReachMetric(key: string): number {
    const p = this.post();
    if (!p || !p.reach || typeof p.reach !== 'object') return 0;
    return (p.reach as any)[key] || 0;
  }
}


