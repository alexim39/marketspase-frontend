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
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FeedService } from '../feed.service';
import { 
  trigger, 
  transition, 
  style, 
  animate, 
  query, 
  stagger 
} from '@angular/animations';
import { FeedPostCardComponent } from '../feed-post-card/feed-post-card.component';
import { UserService } from '../../../common/services/user.service';
import { finalize } from 'rxjs';

export interface CampaignOption {
  _id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  status: string;
  budget: number;
  // Optional fields that might not exist
  spentBudget?: number;
  progress?: number;
}

export interface CreatePostData {
  content: string;
  campaignId: string;
  hashtags?: string[];
  postAnonymously?: boolean;
  disableComments?: boolean;
}

@Component({
  selector: 'app-create-feed-page',
  standalone: true,
  providers: [FeedService],
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
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
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
  @ViewChild('postForm') postForm!: NgForm;

  // State signals
  isSubmitting = signal(false);
  hashtagInput = signal('');
  hashtags = signal<string[]>([]);
  characterCount = signal(0);
  isDirty = signal(false);
  showPreview = signal(false);
  
  suggestedHashtags = signal<string[]>(['campaign', 'progress', 'update', 'marketing', 'success', 'results']);
  suggestedTopics = signal<string[]>([
    // Milestone/Celebration
    'We just hit our first [Number] conversions! 🚀',
    'Celebrating a major campaign milestone today!',
    
    // Behind-the-Scenes/Transparency
    'The strategy behind our latest ad creative.',
    'What we learned from A/B testing our caption.',
    //'A peek into our campaign dashboard this morning.',
    
    // Educational/Value-Driven
    'Top 3 insights from our current marketing push.',
    'Why we chose [Target Audience] for this specific run.',
    'How we are optimizing for better ROI in real-time.',
    
    // Engagement/Questions
    'Which ad version do you find more compelling? (Poll)',
    //'Help us choose the creative for our next phase!',
    'What metrics do you track most closely in your campaigns?'
  ]);


  // Campaigns
  userCampaigns = signal<CampaignOption[]>([]);
  selectedCampaign = signal<CampaignOption | null>(null);
  isLoadingCampaigns = signal(false);

  // Form data
  postData: CreatePostData = {
    content: '',
    campaignId: '',
    hashtags: [],
    postAnonymously: false,
    disableComments: false
  };

  // Preview post
  previewPost = signal<any>(null);

  ngOnInit(): void {
    this.loadUserCampaigns();
    this.updatePreview();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.contentTextarea?.nativeElement.focus();
    }, 300);
  }

  loadUserCampaigns(): void {
    const currentUser = this.user();
    //console.log('currentUser loaded:', currentUser);
    if (!currentUser?._id || currentUser.role !== 'marketer') {
      console.log('User not authorized to load campaigns', currentUser);
      return;
    }

    this.isLoadingCampaigns.set(true);
    
    // Based on your API response structure
    this.feedService.getMarketerCampaigns(currentUser._id).subscribe({
      next: (response) => {
         console.log('Campaigns loaded:', response);
        
        // Extract campaigns from response - adjust based on your API structure
        let campaigns: any[] = [];
        
        if (response.data && Array.isArray(response.data)) {
          // If data is directly an array
          campaigns = response.data;
        } else if (response.data?.campaigns && Array.isArray(response.data.campaigns)) {
          // If data has campaigns property
          campaigns = response.data.campaigns;
        } else if (response.campaigns && Array.isArray(response.campaigns)) {
          // If response has campaigns property
          campaigns = response.campaigns;
        }

        // Map to our interface with safe defaults
        this.userCampaigns.set(campaigns.map((c: any) => ({
          _id: c._id,
          title: c.title || 'Untitled Campaign',
          mediaUrl: c.mediaUrl || '',
          mediaType: c.mediaType || 'image',
          thumbnailUrl: c.thumbnailUrl,
          status: c.status || 'unknown',
          budget: c.budget || 0,
          // These might not exist, provide defaults
          spentBudget: c.spentBudget || 0,
          progress: c.progress || 0
        })));
        
        this.isLoadingCampaigns.set(false);
      },
      error: (error) => {
        console.error('Failed to load campaigns:', error);
        this.snackBar.open('Failed to load your campaigns', 'Dismiss', { duration: 3000 });
        this.isLoadingCampaigns.set(false);
      }
    });
  }

  onCampaignSelect(campaignId: string): void {
    const campaign = this.userCampaigns().find(c => c._id === campaignId);
    this.selectedCampaign.set(campaign || null);
    this.postData.campaignId = campaignId;
    this.updatePreview();
    this.isDirty.set(true);
  }

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

  applySuggestion(topic: string): void {
    this.postData.content = topic;
    this.onContentInput(topic);
  }

  togglePreview(): void {
    this.showPreview.update(val => !val);
  }

  private updatePreview(): void {
    const campaign = this.selectedCampaign();
    
    this.previewPost.set({
      author: this.postData.postAnonymously ? null : {
        displayName: this.user()?.displayName || 'You',
        avatar: this.user()?.avatar || 'img/avatar.png',
        role: 'Marketer',
        rating: this.user()?.rating || 0
      },
      content: this.postData.content,
      type: 'campaign',
      campaign: campaign ? {
        campaignId: campaign._id,
        name: campaign.title,
        budget: campaign.budget,
        spentBudget: campaign.spentBudget || 0,
        status: campaign.status,
        progress: campaign.progress || 0
      } : null,
      media: campaign ? [{
        url: campaign.mediaUrl,
        type: campaign.mediaType,
        thumbnail: campaign.thumbnailUrl
      }] : [],
      hashtags: this.hashtags().map(tag => ({ tag })),
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      time: 'Just now',
      isLiked: false,
      isSaved: false,
      disableComments: this.postData.disableComments
    });
  }

  isFormValid(): boolean {
    return (
      this.postData.content.trim().length >= 10 &&
      !!this.postData.campaignId
    );
  }

/*   onSubmit(): void {
    if (this.isSubmitting() || !this.isFormValid()) return;

    this.isSubmitting.set(true);

    const postPayload = {
      content: this.postData.content,
      campaignId: this.postData.campaignId,
      hashtags: this.hashtags().map(tag => ({ tag })),
      userId: this.user()?._id,
      settings: {
        postAnonymously: this.postData.postAnonymously,
        disableComments: this.postData.disableComments
      }
    };

    // Make sure this method exists in your feed service
    this.feedService.createPost(postPayload).subscribe({
      next: (post) => {
        this.snackBar.open(
          '🎉 Campaign feed posted successfully!',
          'View Post',
          { duration: 5000, panelClass: 'success-snackbar' }
        ).onAction().subscribe(() => {
          this.router.navigate(['/feed', post._id]);
        });
        
        setTimeout(() => {
          this.router.navigate(['/feed']);
        }, 2000);
      },
      error: (error) => {
        console.error('Failed to create post:', error);
        this.snackBar.open(
          'Failed to create post. Please try again.',
          'Dismiss',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
        this.isSubmitting.set(false);
      }
    });
  } */

    onSubmit(): void {
      if (this.isSubmitting() || !this.isFormValid()) return;

      this.isSubmitting.set(true);

       const postPayload = {
        content: this.postData.content,
        campaignId: this.postData.campaignId,
        hashtags: this.hashtags().map(tag => ({ tag })),
        userId: this.user()?._id,
        settings: {
          postAnonymously: this.postData.postAnonymously,
          disableComments: this.postData.disableComments
        }
      };

      this.feedService.createPost(postPayload)
        .pipe(
          // This runs no matter what (success or error)
          finalize(() => this.isSubmitting.set(false)) 
        )
        .subscribe({
          next: (post) => {
            this.snackBar.open('🎉 Posted successfully!', 'View', { duration: 5000 });
            this.router.navigate(['/dashboard/community/feeds']);
          },
          error: (error) => {
            console.error('Failed to create post:', error);
            this.snackBar.open('Error: ' + error.message, 'Dismiss');
            // finalize() handles the loader reset here
          }
        });
    }

  onDiscard(): void {
    if (this.isDirty()) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (confirmed) {
        this.router.navigate(['/dashboard/community/feeds']);
      }
    } else {
      this.router.navigate(['/dashboard/community/feeds']);
    }
  }

  ngOnDestroy(): void {
    // Clean up if needed
  }
}