import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms'; // 1. Import this


// Video Dialog Component
import { VideoPlayerDialogComponent } from './video-player-dialog/video-player-dialog.component';
import { UserService } from '../common/services/user.service';
import { RouterModule } from '@angular/router';
import { SwitchUserRoleService } from '../common/services/switch-user-role.service';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
  videoType: 'youtube' | 'vimeo' | 'local';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  isNew?: boolean;
  isPopular?: boolean;
}

interface Section {
  title: string;
  description: string;
  icon: string;
  videos: VideoItem[];
}

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
    FormsModule,
    RouterModule
  ],
  providers: [],
  templateUrl: './tutorials.component.html',
  styleUrls: ['./tutorials.component.scss']
})
export class TutorialsComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);
  private switchUserRoleService = inject(SwitchUserRoleService); // Event used to trigger user role switcher method

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

  // Promoter tutorials
  promoterSections: Section[] = [
    {
      title: 'Getting Started as a Promoter',
      description: 'Learn the basics of earning money by promoting businesses on WhatsApp',
      icon: 'rocket_launch',
      videos: [
        {
          id: 'promoter-1',
          title: 'How to Start Making Money',
          description: 'Complete beginner\'s guide to becoming a successful promoter on MarketSpase',
          thumbnail: '',
          duration: '8:24',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['beginner', 'basics', 'earnings'],
          difficulty: 'beginner',
          views: 15234,
          isNew: true
        },
        {
          id: 'promoter-2',
          title: 'How to Pick the Right Product',
          description: 'Learn to choose profitable products that resonate with your audience',
          thumbnail: '',
          duration: '12:15',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['strategy', 'profit'],
          difficulty: 'intermediate',
          views: 8923
        },
        {
          id: 'promoter-3',
          title: 'Setting Up Your Profile for Success',
          description: 'Optimize your profile to attract more campaigns and increase earnings',
          thumbnail: '',
          duration: '6:42',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['profile', 'optimization'],
          difficulty: 'beginner',
          views: 12456,
          isPopular: true
        }
      ]
    },
    {
      title: 'Grow Your Earnings',
      description: 'Advanced strategies to maximize your income as a promoter',
      icon: 'trending_up',
      videos: [
        {
          id: 'promoter-4',
          title: 'Why You Get Views But No Sales',
          description: 'Fix conversion issues and turn viewers into buyers',
          thumbnail: '',
          duration: '15:30',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['conversion', 'sales'],
          difficulty: 'intermediate',
          views: 6734
        },
        {
          id: 'promoter-5',
          title: 'How to Write WhatsApp Status That Sells',
          description: 'Improve your posts to drive more engagement and sales',
          thumbnail: '',
          duration: '10:18',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['copywriting', 'engagement'],
          difficulty: 'intermediate',
          views: 10452
        },
        {
          id: 'promoter-6',
          title: 'Building Trust with Your Audience',
          description: 'Establish credibility and build a loyal following',
          thumbnail: '',
          duration: '11:45',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['trust', 'audience'],
          difficulty: 'intermediate',
          views: 5678
        }
      ]
    },
    {
      title: 'Become a Top Promoter',
      description: 'Master the skills to become one of the highest earners on MarketSpase',
      icon: 'stars',
      videos: [
        {
          id: 'promoter-7',
          title: 'Build an Audience That Buys',
          description: 'Grow loyal buyers who trust your recommendations',
          thumbnail: '',
          duration: '14:20',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['audience', 'growth'],
          difficulty: 'advanced',
          views: 4456
        },
        {
          id: 'promoter-8',
          title: 'Leveraging Multiple Social Platforms',
          description: 'Expand your reach beyond WhatsApp for maximum earnings',
          thumbnail: '',
          duration: '18:30',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['multi-platform', 'growth'],
          difficulty: 'advanced',
          views: 3890
        }
      ]
    }
  ];

  // Marketer tutorials
  marketerSections: Section[] = [
    {
      title: 'Getting Started',
      description: 'Learn the fundamentals of running successful marketing campaigns',
      icon: 'rocket_launch',
      videos: [
        {
          id: 'marketer-1',
          title: 'How MarketSpase Works',
          description: 'Complete platform overview for new marketers',
          thumbnail: '',
          duration: '7:15',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['basics', 'overview'],
          difficulty: 'beginner',
          views: 18456,
          isNew: true
        },
        {
          id: 'marketer-2',
          title: 'Create Your First Store',
          description: 'Step-by-step guide to setting up your business store',
          thumbnail: '',
          duration: '9:30',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['store', 'setup'],
          difficulty: 'beginner',
          views: 12453,
          isPopular: true
        },
        {
          id: 'marketer-3',
          title: 'Understanding the Dashboard',
          description: 'Navigate and utilize all dashboard features effectively',
          thumbnail: '',
          duration: '11:20',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['dashboard', 'analytics'],
          difficulty: 'beginner',
          views: 9678
        }
      ]
    },
    {
      title: 'Increase Sales',
      description: 'Proven strategies to boost your campaign performance',
      icon: 'trending_up',
      videos: [
        {
          id: 'marketer-4',
          title: 'Why Your Product Is Not Selling',
          description: 'Identify and fix common product issues',
          thumbnail: '',
          duration: '13:45',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['conversion', 'troubleshooting'],
          difficulty: 'intermediate',
          views: 7823
        },
        {
          id: 'marketer-5',
          title: 'Write Product Descriptions That Sell',
          description: 'Master the art of persuasive copywriting',
          thumbnail: '',
          duration: '12:30',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['copywriting', 'conversion'],
          difficulty: 'intermediate',
          views: 8945
        },
        {
          id: 'marketer-6',
          title: 'Creating High-Converting Visuals',
          description: 'Design eye-catching ads that drive engagement',
          thumbnail: '',
          duration: '16:15',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['design', 'visuals'],
          difficulty: 'intermediate',
          views: 6543
        }
      ]
    },
    {
      title: 'Scale Your Business',
      description: 'Advanced strategies to grow your business exponentially',
      icon: 'stars',
      videos: [
        {
          id: 'marketer-7',
          title: 'Turn Promoters Into Sales Force',
          description: 'Build and manage an effective promoter network',
          thumbnail: '',
          duration: '14:50',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['management', 'scaling'],
          difficulty: 'advanced',
          views: 5123
        },
        {
          id: 'marketer-8',
          title: 'Advanced Campaign Analytics',
          description: 'Deep dive into metrics that matter for growth',
          thumbnail: '',
          duration: '19:30',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['analytics', 'data'],
          difficulty: 'advanced',
          views: 4321
        },
        {
          id: 'marketer-9',
          title: 'Retargeting Strategies That Work',
          description: 'Re-engage interested prospects and boost conversions',
          thumbnail: '',
          duration: '15:40',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          videoType: 'youtube',
          tags: ['retargeting', 'strategy'],
          difficulty: 'advanced',
          views: 3890
        }
      ]
    }
  ];

  // Combined videos for search and filtering
  allVideos = computed(() => {
    const videos: VideoItem[] = [];
    const sections = this.isMarketer() ? this.marketerSections : this.promoterSections;
    sections.forEach(section => {
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
      videos = videos.filter(v => v.tags.includes(category));
    }

    if (difficulty !== 'all') {
      videos = videos.filter(v => v.difficulty === difficulty);
    }

    return videos;
  });

  // Featured videos (new and popular)
  featuredVideos = computed(() => {
    return this.allVideos().filter(v => v.isNew || v.isPopular).slice(0, 4);
  });

  // Group videos by sections for the main view
  filteredSections = computed(() => {
    const sections = this.isMarketer() ? this.marketerSections : this.promoterSections;
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
        const matchesCategory = category === 'all' || video.tags.includes(category);
        const matchesDifficulty = difficulty === 'all' || video.difficulty === difficulty;
        return matchesSearch && matchesCategory && matchesDifficulty;
      })
    })).filter(section => section.videos.length > 0);
  });

  ngOnInit(): void {
    this.loadRecentlyWatched();
  }

  loadRecentlyWatched(): void {
    // Load from localStorage or service
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
    // Save to recently watched
    this.saveRecentlyWatched(video);
    
    // Open video dialog
    const dialogRef = this.dialog.open(VideoPlayerDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: 'auto',
      data: {
        video: video,
        userRole: this.userRole()
      },
      panelClass: 'video-dialog'
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Track view count or other analytics
        this.trackVideoView(video);
      });
  }

  trackVideoView(video: VideoItem): void {
    // Implement analytics tracking
    console.log('Video viewed:', video.title);
    // You can call an API endpoint to track views
  }

  shareVideo(video: VideoItem, event: Event): void {
    event.stopPropagation();
    // Implement sharing functionality
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: video.videoUrl
      }).catch(() => {
        this.copyToClipboard(video.videoUrl);
      });
    } else {
      this.copyToClipboard(video.videoUrl);
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

  // Get role-specific welcome message
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
    // 6. Broadcast the signal to switch user role on sidenav.component
    this.switchUserRoleService.sendSwitchRequest(this.userRole());
  }
}