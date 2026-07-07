import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '@shared/services/api';
import { FeedPostCardComponent } from '../../community/feeds/feed-post-card/feed-post-card.component';
import { CommentDialogComponent } from '../../community/feeds/comment-dialog/comment-dialog.component';
import { UserService } from '../../common/services/user.service';
import { EngagementService } from '../engagement.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-promoter-engagement-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, FeedPostCardComponent],
  templateUrl: './promoter-engagement-feed.component.html',
  styleUrls: ['./promoter-engagement-feed.component.scss']
})
export class PromoterEngagementFeedComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private userService = inject(UserService);
  private engagementService = inject(EngagementService);
  private searchSubject = new Subject<string>();

  user = this.userService.user;
  posts = signal<any[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  platformFilter = signal('');
  searchQuery = signal('');
  likedPosts = signal<Set<string>>(new Set());
  savedPosts = signal<Set<string>>(new Set());
  activeContractCount = signal(0);
  todayEngagements = signal(0);
  contractedMarketerIds = signal<Set<string>>(new Set());
  page = 1;
  totalPages = signal(1);

  filteredPosts = computed(() => {
    let all = this.posts() || [];
    if (!Array.isArray(all)) return [];
    const f = this.platformFilter();
    const q = this.searchQuery().toLowerCase();
    const contracted = this.contractedMarketerIds();

    // Filter by contracted marketer or social-promo
    all = all.filter((p: any) => {
      const authorId = p.author?._id || p.author;
      return contracted.has(authorId) || p.socialPlatform;
    });

    // Platform filter
    if (f) all = all.filter((p: any) => p.socialPlatform === f);

    // Search filter
    if (q) all = all.filter((p: any) =>
      (p.content || '').toLowerCase().includes(q) ||
      (p.author?.displayName || '').toLowerCase().includes(q) ||
      (p.campaign?.name || '').toLowerCase().includes(q) ||
      (p.product?.name || '').toLowerCase().includes(q)
    );

    return all;
  });

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (this.loading() || this.loadingMore()) return;
    if (this.page > this.totalPages()) return;
    const pos = window.innerHeight + window.scrollY;
    const bottom = document.body.offsetHeight - 600;
    if (pos >= bottom) this.loadPosts(false);
  }

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe(q => {
      this.searchQuery.set(q);
    });
    this.loadContractsAndPosts();
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  loadContractsAndPosts(): void {
    this.loading.set(true);
    const safety = setTimeout(() => this.loading.set(false), 10000);

    this.engagementService.listContracts('promoter').subscribe({
      next: (r: any) => {
        clearTimeout(safety);
        const contracts = r?.data || [];
        this.activeContractCount.set(contracts.filter((c: any) => c.status === 'active').length);

        const ids = new Set<string>();
        contracts.forEach((c: any) => {
          const mid = c.marketerId?._id || c.marketerId;
          if (mid) ids.add(String(mid));
        });
        this.contractedMarketerIds.set(ids);

        this.loadPosts(true);
      },
      error: () => { clearTimeout(safety); this.loading.set(false); }
    });
  }

  loadPosts(reset: boolean): void {
    if (reset) { this.page = 1; this.totalPages.set(1); this.posts.set([]); this.loading.set(true); }
    else this.loadingMore.set(true);

    const params = new URLSearchParams();
    params.set('page', String(this.page));
    params.set('limit', '10');
    params.set('feedType', 'for_you');
    if (this.user()?._id) params.set('userId', this.user()!._id);

    this.api.get<any>(`api/v1/feed/list?${params.toString()}`, undefined, undefined, true).subscribe({
      next: (r: any) => {
        const newPosts = Array.isArray(r?.posts) ? r.posts : (Array.isArray(r?.data) ? r.data : (Array.isArray(r?.data?.posts) ? r.data.posts : []));
        this.posts.update(prev => reset ? newPosts : [...prev, ...newPosts]);
        this.totalPages.set(r?.pagination?.pages || r?.totalPages || (newPosts.length < 10 ? this.page : this.page + 1));
        if (newPosts.length > 0) this.page++;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('Feed load failed:', err);
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  onEngage(post: any, type: string): void {
    if (!post?._id) return;

    if (type === 'like') {
      this.api.post(`api/v1/feed/${post._id}/like`, {}, undefined, true).subscribe(() => {
        const set = new Set(this.likedPosts());
        set.has(post._id) ? set.delete(post._id) : set.add(post._id);
        this.likedPosts.set(set);
        this.todayEngagements.update(v => v + 1);
      });
    } else if (type === 'save') {
      this.api.post(`api/v1/feed/${post._id}/save`, {}, undefined, true).subscribe(() => {
        const set = new Set(this.savedPosts());
        set.has(post._id) ? set.delete(post._id) : set.add(post._id);
        this.savedPosts.set(set);
      });
    } else if (type === 'share') {
      this.api.post(`api/v1/feed/${post._id}/share`, { platform: 'internal' }, undefined, true).subscribe(() => {
        this.todayEngagements.update(v => v + 1);
        this.snack.open('Post shared!', 'OK', { duration: 1500 });
      });
    } else if (type === 'comment') {
      const ref = this.dialog.open(CommentDialogComponent, {
        width: '640px', maxWidth: '96vw', panelClass: 'comment-dialog-panel',
        disableClose: true, data: { postId: post._id }
      });
      ref.afterClosed().subscribe(() => {
        this.todayEngagements.update(v => v + 1);
      });
    }
  }
}
