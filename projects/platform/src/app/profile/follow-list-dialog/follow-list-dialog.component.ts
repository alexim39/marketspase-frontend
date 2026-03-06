import { Component, Inject, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileService, FollowUser } from '../services/profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-follow-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [ProfileService],
  templateUrl: './follow-list-dialog.component.html',
  styleUrls: ['./follow-list-dialog.component.scss'],
})
export class FollowListDialogComponent implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private router = inject(Router);

  data: { userId: string; type: 'followers' | 'following' } = inject(MAT_DIALOG_DATA);

  users = signal<FollowUser[]>([]);
  loading = signal(true);
  page = signal(1);
  hasMore = signal(true);
  loadingMore = signal(false);

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private intersectionObserver: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.loadUsers(true);
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  loadUsers(reset = false): void {
    if (this.loadingMore() || (!reset && !this.hasMore())) return;

    if (reset) {
      this.loading.set(true);
      this.page.set(1);
      this.users.set([]);
    } else {
      this.loadingMore.set(true);
    }

    const observable = this.data.type === 'followers'
      ? this.profileService.getFollowers(this.data.userId, this.page())
      : this.profileService.getFollowing(this.data.userId, this.page());

    observable.subscribe({
      next: (res) => {
        const listKey = this.data.type; // 'followers' or 'following'
        const newUsers = res[listKey] as FollowUser[];
        this.users.update(prev => [...prev, ...newUsers]);
        this.hasMore.set(res.page < res.totalPages);
        this.page.update(p => p + 1);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.setupInfiniteScroll();
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  private setupInfiniteScroll(): void {
    if (!this.scrollAnchor) return;
    if (this.intersectionObserver) this.intersectionObserver.disconnect();

    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasMore() && !this.loadingMore()) {
        this.loadUsers();
      }
    }, { threshold: 0.5 });

    this.intersectionObserver.observe(this.scrollAnchor.nativeElement);
  }

  viewProfile(userId: string): void {
    this.router.navigate(['/dashboard/profile', userId]);
    // Close dialog after navigation? You can leave open or close.
  }
}