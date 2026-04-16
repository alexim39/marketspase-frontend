import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { ForumService, Thread, PinnedThread, TrendingThread } from './forum.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThreadListComponent } from './thread/thread-list/thread-list.component';
import { CreateThreadComponent } from './create-thread/create-thread.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { finalize, Subject, takeUntil, forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { DeviceService } from '../../../../../shared-services/src/public-api';

interface ActiveUser {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  avatarColor: string;
  postCount: number;
  commentCount?: number;
  totalLikes?: number;
}

interface CommunityStats {
  totalMembers: number;
  totalDiscussions: number;
  totalComments: number;
  todayDiscussions: number;
  todayComments: number;
  todayActivity: number;
}

@Component({
  selector: 'app-forum-page',
  standalone: true,
  providers: [ForumService],
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ThreadListComponent,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl:'./forum-page.component.html', 
  styleUrls: ['./forum-page.component.scss']
})
export class ForumPageComponent implements OnInit, OnDestroy {
  private readonly deviceService = inject(DeviceService);

  threads: Thread[] = [];
  selectedThread: Thread | null = null;
  isLoading = false;
  currentView: 'list' | 'detail' = 'list';
  popularTags: string[] = [];
  selectedTag: string | null = null;
  
  // Sidebar data
  communityStats: CommunityStats = {
    totalMembers: 0,
    totalDiscussions: 0,
    totalComments: 0,
    todayDiscussions: 0,
    todayComments: 0,
    todayActivity: 0
  };
  pinnedThreads: PinnedThread[] = [];
  trendingThreads: TrendingThread[] = [];
  activeUsers: ActiveUser[] = [];
  
  // Search and filter
  searchQuery = '';
  sortBy = 'newest';
  filterCategory = '';
  
  private destroy$ = new Subject<void>();

  isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });

  constructor(
    private forumService: ForumService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['threadId']) {
        this.currentView = 'detail';
        this.loadThread(params['threadId']);
      } else {
        this.currentView = 'list';
        this.loadAllData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.isLoading = true;
    
    // Load all data in parallel
    forkJoin({
      threads: this.forumService.getThreads(),
      stats: this.forumService.getCommunityStats(),
      pinned: this.forumService.getPinnedThreads(),
      trending: this.forumService.getTrendingThreads(),
      activeUsers: this.forumService.getActiveUsers(),
      popularTags: this.forumService.getPopularTags()
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        this.threads = results.threads?.data || [];
        this.communityStats = results.stats?.data || this.communityStats;
        this.pinnedThreads = results.pinned?.data || [];
        this.trendingThreads = results.trending?.data || [];
        this.activeUsers = results.activeUsers?.data || [];
        this.popularTags = results.popularTags?.data || [];
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading forum data:', err);
        // Fallback to just loading threads
        this.loadThreads();
      }
    });
  }

  loadThreads(): void {
    this.isLoading = true;
    this.selectedThread = null;

    this.forumService.getThreads().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges(); 
      })
    ).subscribe({
      next: (response) => {
        this.threads = response?.data || [];
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Error loading threads:', err);
        this.threads = [];
        this.cd.detectChanges(); 
      }
    });
  }

  loadThread(threadId: string): void {
    this.isLoading = true;

    this.forumService.getThreadById(threadId).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.selectedThread = response?.data || response;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading thread:', err);
        this.selectedThread = null;
        this.cd.detectChanges();
      }
    });
  }

  loadSidebarData(): void {
    // Load sidebar data independently
    forkJoin({
      stats: this.forumService.getCommunityStats(),
      pinned: this.forumService.getPinnedThreads(),
      trending: this.forumService.getTrendingThreads(),
      activeUsers: this.forumService.getActiveUsers(),
      popularTags: this.forumService.getPopularTags()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.communityStats = results.stats?.data || this.communityStats;
        this.pinnedThreads = results.pinned?.data || [];
        this.trendingThreads = results.trending?.data || [];
        this.activeUsers = results.activeUsers?.data || [];
        this.popularTags = results.popularTags?.data || [];
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading sidebar data:', err);
      }
    });
  }

  searchThreads(query: string): void {
    if (!query || query.trim().length < 2) {
      this.loadThreads();
      return;
    }

    this.isLoading = true;
    this.forumService.searchThreads(query, this.sortBy, this.filterCategory).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.threads = response?.data || [];
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error searching threads:', err);
        this.threads = [];
        this.cd.detectChanges();
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    
    // Debounce search
    if (this.searchQuery.length >= 2 || this.searchQuery.length === 0) {
      this.searchThreads(this.searchQuery);
    }
  }

  applyFilter(filter: string): void {
    this.sortBy = filter;
    if (this.searchQuery) {
      this.searchThreads(this.searchQuery);
    } else {
      this.loadThreads();
    }
  }

  applySort(sort: string): void {
    this.sortBy = sort;
    if (this.searchQuery) {
      this.searchThreads(this.searchQuery);
    } else {
      this.loadThreads();
    }
  }

  navigateToThread(threadId: string): void {
    if (threadId) { 
      this.router.navigate(['/dashboard/community/discussion', threadId]);  
    }
  }

  backToList(): void {
    this.router.navigate(['/dashboard/community']);
  }

  openCreateThreadDialog(): void {
    const dialogRef = this.dialog.open(CreateThreadComponent, {
      width: '600px',
      maxWidth: '100vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAllData(); // Reload all data after creating new thread
      }
    });
  }

  filterByTag(tag: string | null): void {
    this.selectedTag = tag;
    this.isLoading = true;
    
    if (!tag) {
      this.loadThreads();
      return;
    }

    this.forumService.getThreadsByTag(tag).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges(); 
      })
    ).subscribe({
      next: (response) => {
        this.threads = response?.data || [];
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Error filtering threads:', err);
        this.threads = [];
        this.cd.detectChanges(); 
      }
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}