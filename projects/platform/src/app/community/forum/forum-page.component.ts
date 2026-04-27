import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { ForumService, Thread, PinnedThread, TrendingThread } from './forum.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { finalize, Subject, takeUntil, forkJoin, debounceTime, distinctUntilChanged } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { DeviceService } from '../../../../../shared-services/src/public-api';
import { FormControl } from '@angular/forms';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
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
    RouterModule
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
  searchControl = new FormControl('');
  searchQuery = '';
  sortBy = 'newest';
  filterCategory = '';
  
  // Pagination
  pagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  };
  
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
    // Setup search debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.searchQuery = value || '';
      this.pagination.page = 1; // Reset to first page on new search
      if (this.searchQuery.length >= 2 || this.searchQuery.length === 0) {
        this.searchThreads(this.searchQuery);
      }
    });

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

    // Check for query params (page, sort, etc.)
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(queryParams => {
      if (queryParams['page']) {
        this.pagination.page = parseInt(queryParams['page'], 10);
      }
      if (queryParams['sort']) {
        this.sortBy = queryParams['sort'];
      }
      if (queryParams['tag']) {
        this.selectedTag = queryParams['tag'];
        this.filterByTag(this.selectedTag);
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
      threads: this.forumService.getThreads({ 
        page: this.pagination.page, 
        limit: this.pagination.limit,
        sortBy: this.sortBy 
      }),
      stats: this.forumService.getCommunityStats(),
      pinned: this.forumService.getPinnedThreads(5),
      trending: this.forumService.getTrendingThreads(5),
      activeUsers: this.forumService.getActiveUsers(5),
      popularTags: this.forumService.getPopularTags(10)
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        this.threads = results.threads?.data || [];
        //console.log('Loaded threads:', this.threads);
        
        // Update pagination info
        if (results.threads?.pagination) {
          this.pagination = {
            ...this.pagination,
            ...results.threads.pagination
          };
        }
        
        this.communityStats = results.stats?.data || this.communityStats;
        this.pinnedThreads = results.pinned?.data || [];
        this.trendingThreads = results.trending?.data || [];
        this.activeUsers = results.activeUsers?.data || [];
        this.popularTags = results.popularTags?.data || [];
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading forum data:', err);
        // Set fallback data for sidebar
        this.setFallbackSidebarData();
        this.loadThreads();
      }
    });
  }

  loadThreads(): void {
    this.isLoading = true;
    this.selectedThread = null;

    this.forumService.getThreads({ 
      page: this.pagination.page, 
      limit: this.pagination.limit,
      sortBy: this.sortBy 
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges(); 
      })
    ).subscribe({
      next: (response) => {
        this.threads = response?.data || [];
        
        // Update pagination info
        if (response?.pagination) {
          this.pagination = {
            ...this.pagination,
            ...response.pagination
          };
        }
        
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

  /**
   * Set fallback data for sidebar when API fails
   */
  private setFallbackSidebarData(): void {
    // Only set if arrays are empty
    if (this.pinnedThreads.length === 0) {
      this.pinnedThreads = [
        { _id: '1', title: 'Welcome to the Community!', replyCount: 45, createdAt: new Date().toISOString(), url: '/forum/thread/1', author: { displayName: 'Admin', username: 'admin' } },
        { _id: '2', title: 'Community Guidelines', replyCount: 23, createdAt: new Date().toISOString(), url: '/forum/thread/2', author: { displayName: 'Admin', username: 'admin' } }
      ] as PinnedThread[];
    }
    
    if (this.trendingThreads.length === 0) {
      this.trendingThreads = [
        { _id: '3', title: 'Tips for New Marketers', tags: ['marketers'], activityCount: 156, createdAt: new Date().toISOString(), stats: { views: 1200, likes: 45, comments: 23 }, author: { displayName: 'John Doe', username: 'johndoe' } },
        { _id: '4', title: 'Best Promotion Strategies', tags: ['promoters'], activityCount: 134, createdAt: new Date().toISOString(), stats: { views: 980, likes: 38, comments: 19 }, author: { displayName: 'Jane Smith', username: 'janesmith' } }
      ] as TrendingThread[];
    }
    
    if (this.activeUsers.length === 0) {
      this.activeUsers = [
        { id: 'u1', name: 'Sarah Johnson', initials: 'SJ', avatarColor: '#4CAF50', postCount: 156 },
        { id: 'u2', name: 'Mike Chen', initials: 'MC', avatarColor: '#2196F3', postCount: 134 }
      ];
    }
    
    if (this.popularTags.length === 0) {
      this.popularTags = ['marketers', 'promoters', 'discussion', 'announcements', 'questions', 'how-to'];
    }
  }

  searchThreads(query: string): void {
    if (!query || query.trim().length < 2) {
      this.loadThreads();
      return;
    }

    this.isLoading = true;
    this.forumService.searchThreads(query, this.sortBy, this.filterCategory, {
      page: this.pagination.page,
      limit: this.pagination.limit
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.threads = response?.data || [];
        
        // Update pagination info
        if (response?.pagination) {
          this.pagination = {
            ...this.pagination,
            ...response.pagination
          };
        }
        
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
    this.searchControl.setValue(input.value);
  }

  applyFilter(filter: string): void {
    this.sortBy = filter;
    this.pagination.page = 1; // Reset to first page
    
    if (this.searchQuery) {
      this.searchThreads(this.searchQuery);
    } else {
      this.loadThreads();
    }
  }

  applySort(sort: string): void {
    this.sortBy = sort;
    this.pagination.page = 1; // Reset to first page
    
    if (this.searchQuery) {
      this.searchThreads(this.searchQuery);
    } else {
      this.loadThreads();
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number | string): void {
    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page;
    
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > this.pagination.totalPages || pageNumber === this.pagination.page) {
      return;
    }
    
    this.pagination.page = pageNumber;
    
    // Update URL with page param
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: pageNumber },
      queryParamsHandling: 'merge'
    });
    
    if (this.selectedTag) {
      this.filterByTag(this.selectedTag);
    } else if (this.searchQuery) {
      this.searchThreads(this.searchQuery);
    } else {
      this.loadThreads();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.pagination.page > 1) {
      this.goToPage(this.pagination.page - 1);
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages) {
      this.goToPage(this.pagination.page + 1);
    }
  }

  /**
   * Get max display items for pagination info
   */
  getMaxDisplayItems(): number {
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }

  /**
   * Generate array of page numbers for pagination display
   */
  getPageNumbers(): (number | string)[] {
    const currentPage = this.pagination.page;
    const totalPages = this.pagination.totalPages;
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
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
        this.pagination.page = 1; // Reset to first page
        this.loadAllData(); // Reload all data after creating new thread
      }
    });
  }

  filterByTag(tag: string | null): void {
    this.selectedTag = tag;
    this.isLoading = true;
    this.pagination.page = 1; // Reset to first page
    
    // Update URL with tag param
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tag: tag || null },
      queryParamsHandling: 'merge'
    });
    
    if (!tag) {
      this.loadThreads();
      return;
    }

    this.forumService.getThreadsByTag(tag, {
      page: this.pagination.page,
      limit: this.pagination.limit
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges(); 
      })
    ).subscribe({
      next: (response) => {
        this.threads = response?.data || [];
        
        // Update pagination info
        if (response?.pagination) {
          this.pagination = {
            ...this.pagination,
            ...response.pagination
          };
        }
        
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}