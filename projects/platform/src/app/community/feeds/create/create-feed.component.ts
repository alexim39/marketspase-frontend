import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { FeedService } from '../feed.service';
import { 
  trigger, 
  transition, 
  style, 
  animate, 
  query, 
  stagger,
  state 
} from '@angular/animations';
import { FeedPostCardComponent } from '../feed-post-card/feed-post-card.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserService } from '../../../common/services/user.service';

export interface CreatePostData {
  content: string;
  type: 'earnings' | 'campaign' | 'question' | 'tip' | 'achievement' | 'milestone';
  earnings?: {
    amount: number;
    currency: string;
    milestone?: string;
    campaignId?: string;
  };
  campaign?: {
    campaignId: string;
    name: string;
    budget: number;
    status?: string;
  };
  tip?: {
    title: string;
    category: string;
    content?: string;
  };
  media?: {
    file: File;
    preview: string;
    type: 'image' | 'video';
  }[];
  hashtags?: string[];
}

@Component({
  selector: 'app-create-feed-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatTabsModule,
    FeedPostCardComponent,
    MatCheckboxModule
  ],
  templateUrl: './create-feed.component.html',
  styleUrls: ['./create-feed.component.scss'],
  animations: [
    trigger('pageTransition', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('staggerItems', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class CreateFeedPageComponent implements OnInit, AfterViewInit {
  private feedService = inject(FeedService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private userService = inject(UserService);
  public user = this.userService.user;

  @ViewChild('contentTextarea') contentTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('postForm') postForm!: NgForm;

  // State signals
  isSubmitting = signal(false);
  currentStep = signal(0);
  selectedFiles = signal<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  hashtagInput = signal('');
  hashtags = signal<string[]>([]);
  characterCount = signal(0);
  showPreview = signal(false);
  isDirty = signal(false);
  suggestedHashtags = signal<string[]>(['marketing', 'success', 'tips', 'campaign', 'earnings', 'growth']);
  suggestedTopics = signal<string[]>([
    'How I earned my first ₦100k',
    'Top marketing strategies',
    'Campaign success story',
    'Daily tips for promoters',
    'Avoid these mistakes'
  ]);

  // Form data
  postData: CreatePostData = {
    content: '',
    type: 'question',
    earnings: {
      amount: 0,
      currency: 'NGN',
      milestone: ''
    },
    campaign: {
      campaignId: '',
      name: '',
      budget: 0
    },
    tip: {
      title: '',
      category: 'marketing'
    },
    hashtags: []
  };

  // Preview post for live preview
  previewPost = signal<any>(null);

  ngOnInit(): void {
    this.updatePreview();
  }

  ngAfterViewInit(): void {
    // Focus on content textarea after view init
    setTimeout(() => {
      this.contentTextarea?.nativeElement.focus();
    }, 300);
  }

  // Handle type change
  onTypeChange(): void {
    // Reset type-specific fields
    if (this.postData.type !== 'earnings') {
      this.postData.earnings = { amount: 0, currency: 'NGN', milestone: '' };
    }
    if (this.postData.type !== 'campaign') {
      this.postData.campaign = { campaignId: '', name: '', budget: 0 };
    }
    if (this.postData.type !== 'tip') {
      this.postData.tip = { title: '', category: 'marketing' };
    }
    this.updatePreview();
    this.isDirty.set(true);
  }

  // Handle content input
  onContentInput(content: string): void {
    this.characterCount.set(content.length);
    this.updatePreview();
    this.isDirty.set(true);
    
    // Auto-extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    if (matches) {
      const extractedHashtags = matches.map(tag => tag.substring(1).toLowerCase());
      this.hashtags.set(extractedHashtags);
    }
  }

  // File handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' as const : 'video' as const
      }));
      
      this.selectedFiles.update(files => [...files, ...newFiles]);
      this.updatePreview();
      this.isDirty.set(true);
    }
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    URL.revokeObjectURL(files[index].preview); // Clean up object URL
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.updatePreview();
  }

  // Hashtag handling
  addHashtag(tag: string): void {
    if (!tag.trim()) return;
    const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedTag && !this.hashtags().includes(normalizedTag)) {
      this.hashtags.update(tags => [...tags, normalizedTag]);
      this.hashtagInput.set('');
      this.updatePreview();
    }
  }

  removeHashtag(index: number): void {
    this.hashtags.update(tags => tags.filter((_, i) => i !== index));
    this.updatePreview();
  }

  addSuggestedHashtag(tag: string): void {
    this.addHashtag(tag);
  }

  // Topic suggestions
  applySuggestion(topic: string): void {
    this.postData.content = topic;
    this.onContentInput(topic);
  }

  // Form navigation
  nextStep(): void {
    if (this.currentStep() < 2) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }

  goToStep(step: number): void {
    if (step >= 0 && step <= 2) {
      this.currentStep.set(step);
    }
  }

  // Preview
  togglePreview(): void {
    this.showPreview.update(val => !val);
  }

  private updatePreview(): void {
    this.previewPost.set({
      author: {
        displayName: 'You',
        avatar: 'img/avatar.png',
        role: 'Member',
        rating: 4.8
      },
      content: this.postData.content,
      type: this.postData.type,
      earnings: this.postData.earnings,
      campaign: this.postData.campaign,
      tip: this.postData.tip,
      media: this.selectedFiles().map(f => ({
        url: f.preview,
        type: f.type
      })),
      hashtags: this.hashtags().map(tag => ({ tag })),
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      time: 'Just now',
      isLiked: false,
      isSaved: false
    });
  }

  // Form validation
  isStepValid(step: number): boolean {
    switch (step) {
      case 0: // Content step
        return this.postData.content.trim().length >= 10;
      case 1: // Details step
        if (this.postData.type === 'earnings') {
          return (this.postData.earnings?.amount ?? 0) > 0;
        }
        if (this.postData.type === 'campaign') {
          return !!(this.postData.campaign?.name && (this.postData.campaign?.budget ?? 0) > 0);
        }
        if (this.postData.type === 'tip') {
          return !!(this.postData.tip?.title && this.postData.tip?.category);
        }
        return true; // Question type doesn't need additional validation
      case 2: // Review step
        return true;
      default:
        return false;
    }
  }

  // Submit form
  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const postPayload = {
      ...this.postData,
      hashtags: this.hashtags().map(tag => ({ tag })),
      media: this.selectedFiles().map(f => ({
        file: f.file,
        type: f.type
      })),
      userId: this.user()?._id
    };

    this.feedService.createPost(postPayload).subscribe({
      next: (post) => {
        this.snackBar.open(
          '🎉 Post created successfully!',
          'View Post',
          { 
            duration: 5000,
            panelClass: 'success-snackbar'
          }
        ).onAction().subscribe(() => {
          this.router.navigate(['/feed', post._id]);
        });
        
        // Navigate back to feed after short delay
        setTimeout(() => {
          this.router.navigate(['/feed']);
        }, 2000);
      },
      error: (error) => {
        this.snackBar.open(
          'Failed to create post. Please try again.',
          'Dismiss',
          { 
            duration: 5000,
            panelClass: 'error-snackbar'
          }
        );
        this.isSubmitting.set(false);
      }
    });
  }

  // Discard draft
  onDiscard(): void {
    if (this.isDirty()) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (confirmed) {
        this.router.navigate(['/feed']);
      }
    } else {
      this.router.navigate(['/feed']);
    }
  }

  // Clean up object URLs
  ngOnDestroy(): void {
    this.selectedFiles().forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
  }
}