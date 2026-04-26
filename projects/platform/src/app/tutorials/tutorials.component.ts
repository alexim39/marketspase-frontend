// tutorials.component.ts
import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Video Dialog Component
import { VideoPlayerDialogComponent } from './video-player-dialog/video-player-dialog.component';
import { UserService } from '../common/services/user.service';
import { SwitchUserRoleService } from '../common/services/switch-user-role.service';
import { TutorialService, VideoItem, Section } from './services/tutorial.service';

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-tutorials',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule
  ],
  providers: [TutorialService],
  templateUrl: './tutorials.component.html',
  styleUrls: ['./tutorials.component.scss'],
})
export class TutorialsComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);
  private switchUserRoleService = inject(SwitchUserRoleService);
  private tutorialService = inject(TutorialService);

  // User signals
  user = this.userService.user;
  userRole = computed(() => this.user()?.role || '');
  isMarketer = computed(() => ['marketer', 'admin'].includes(this.userRole()));
  isPromoter = computed(() => ['promoter', 'admin'].includes(this.userRole()));

  // UI State
  selectedTab = signal(0);
  searchQuery = signal('');
  selectedCategory = signal<string>('all');
  selectedDifficulty = signal<string>('all');
  isGridView = signal(true);
  recentlyWatched = signal<VideoItem[]>([]);
  
  // Data state
  tutorialSections = signal<Section[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // Video categories
  categories: Category[] = [
    { id: 'all', label: 'All Videos', icon: 'play_circle', color: 'primary' },
    { id: 'getting-started', label: 'Getting Started', icon: 'rocket_launch', color: 'accent' },
    { id: 'earnings', label: 'Earnings & Payments', icon: 'payments', color: 'success' },
    { id: 'optimization', label: 'Optimization', icon: 'trending_up', color: 'warning' },
    { id: 'advanced', label: 'Advanced', icon: 'stars', color: 'info' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: 'bug_report', color: 'error' }
  ];

  difficultyLevels = [
    { id: 'all', label: 'All Levels', icon: 'menu' },
    { id: 'beginner', label: 'Beginner', icon: 'school', color: 'success' },
    { id: 'intermediate', label: 'Intermediate', icon: 'trending_up', color: 'warning' },
    { id: 'advanced', label: 'Advanced', icon: 'auto_awesome', color: 'error' }
  ];

  // Combined videos for search and filtering
  allVideos = computed(() => {
    const videos: VideoItem[] = [];
    this.tutorialSections().forEach(section => {
      videos.push(...section.videos);
    });
    return videos;
  });

  // Filtered videos based on search and category
  filteredVideos = computed(() => {
    let videos = this.allVideos();
    const search = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const difficulty = this.selectedDifficulty();

    if (search) {
      videos = videos.filter(v => 
        v.title.toLowerCase().includes(search) || 
        v.description.toLowerCase().includes(search) ||
        v.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (category !== 'all') {
      videos = videos.filter(v => v.tags.some(tag => 
        tag.toLowerCase().includes(category)
      ));
    }

    if (difficulty !== 'all') {
      videos = videos.filter(v => v.difficulty === difficulty);
    }

    return videos;
  });

  // Featured videos (new and popular)
  featuredVideos = computed(() => {
    return this.allVideos()
      .filter(v => v.isNew || v.isPopular)
      .slice(0, 4);
  });

  // Group videos by sections for the main view
  filteredSections = computed(() => {
    const sections = this.tutorialSections();
    const search = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const difficulty = this.selectedDifficulty();

    if (!search && category === 'all' && difficulty === 'all') {
      return sections;
    }

    return sections.map(section => ({
      ...section,
      videos: section.videos.filter(video => {
        const matchesSearch = !search || 
          video.title.toLowerCase().includes(search) || 
          video.description.toLowerCase().includes(search) ||
          video.tags.some(tag => tag.toLowerCase().includes(search));
        const matchesCategory = category === 'all' || 
          video.tags.some(tag => tag.toLowerCase().includes(category));
        const matchesDifficulty = difficulty === 'all' || video.difficulty === difficulty;
        return matchesSearch && matchesCategory && matchesDifficulty;
      })
    })).filter(section => section.videos.length > 0);
  });

  ngOnInit(): void {
    this.loadRecentlyWatched();
    this.loadTutorials();
  }

  loadTutorials(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    
    this.tutorialService.getTutorials(this.userRole())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sections) => {
          this.tutorialSections.set(sections);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load tutorials:', error);
          this.loadError.set('Failed to load tutorials. Please try again.');
          this.isLoading.set(false);
          this.snackBar.open('Failed to load tutorials', 'Retry', { duration: 5000 })
            .onAction()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.loadTutorials());
        }
      });
  }

  loadRecentlyWatched(): void {
    const saved = localStorage.getItem('recentlyWatched');
    if (saved) {
      try {
        this.recentlyWatched.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recently watched', e);
      }
    }
  }

  saveRecentlyWatched(video: VideoItem): void {
    const current = this.recentlyWatched();
    const filtered = current.filter(v => v.id !== video.id);
    const updated = [video, ...filtered].slice(0, 10);
    this.recentlyWatched.set(updated);
    localStorage.setItem('recentlyWatched', JSON.stringify(updated));
  }

  playVideo(video: VideoItem): void {
    this.saveRecentlyWatched(video);
    
    const dialogRef = this.dialog.open(VideoPlayerDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: 'auto',
      disableClose: true,
      data: {
        video: video,
        userRole: this.userRole()
      },
      panelClass: 'video-dialog'
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.trackVideoView(video);
      });
  }

  trackVideoView(video: VideoItem): void {
    console.log('Video viewed:', video.title);
    // TODO: Implement analytics tracking API call
  }

  shareVideo(video: VideoItem, event: Event): void {
    event.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: video.videoUrl
      }).catch(() => {
        this.copyToClipboard(`https://youtu.be/${video.id}`);
      });
    } else {
      this.copyToClipboard(`https://youtu.be/${video.id}`);
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    });
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'primary';
    }
  }

  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.selectedDifficulty.set('all');
    this.snackBar.open('Filters cleared', 'Close', { duration: 2000 });
  }

  toggleView(): void {
    this.isGridView.update(value => !value);
  }

  getWelcomeMessage(): string {
    if (this.isMarketer()) {
      return 'Learn how to create successful campaigns and grow your business';
    }
    if (this.isPromoter()) {
      return 'Master the art of promotion and maximize your earnings';
    }
    return 'Discover everything you need to succeed on MarketSpase';
  }

  setIsGridView(isGrid: boolean): void {
    this.isGridView.set(isGrid);
  }

  switchUserRole() {
    this.switchUserRoleService.sendSwitchRequest(this.userRole());
  }
}