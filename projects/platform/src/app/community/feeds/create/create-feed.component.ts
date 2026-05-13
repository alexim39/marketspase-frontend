import { Component, computed, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedPostCardComponent } from '../feed-post-card/feed-post-card.component';
import { FeedPost, FeedService } from '../feed.service';
import { UserService } from '../../../common/services/user.service';
import { ProductService } from '../../../store/marketer/products/product.service';
import { StoreService } from '../../../store/services/store.service';

interface CampaignOption {
  _id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  status: string;
  budget: number;
  spentBudget?: number;
  progress?: number;
}

interface StoreOption {
  _id: string;
  name: string;
  storeLink?: string;
}

interface ProductOption {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  category?: string;
  description?: string;
  images?: Array<{ url: string; altText?: string; isMain?: boolean }>;
  store?: { _id: string; name: string; storeLink?: string };
}

interface LocalMediaPreview {
  file?: File;
  url: string;
  type: 'image' | 'video' | 'document';
  thumbnail?: string;
  altText?: string;
  source: 'upload' | 'linked';
}

@Component({
  selector: 'app-create-feed-page',
  standalone: true,
  providers: [FeedService, StoreService, ProductService],
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
  styleUrls: ['./create-feed.component.scss']
})
export class CreateFeedPageComponent implements OnInit {
  private readonly feedService = inject(FeedService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly storeService = inject(StoreService);
  private readonly productService = inject(ProductService);

  public user = this.userService.user;

  @ViewChild('mediaInput') mediaInput!: ElementRef<HTMLInputElement>;

  isSubmitting = signal(false);
  isLoadingCampaigns = signal(false);
  isLoadingStores = signal(false);
  isLoadingProducts = signal(false);
  isLoadingPost = signal(false);
  isDirty = signal(false);
  showPreview = signal(true);
  sourceType = signal<'campaign' | 'product' | 'manual'>('campaign');
  hashtagInput = signal('');
  hashtags = signal<string[]>([]);
  characterCount = signal(0);
  challengeTag = signal('');
  challengeTitle = signal('');
  challengeReward = signal('');
  currentStoreId = signal('');
  postId = signal<string | null>(null);
  uploadedMedia = signal<LocalMediaPreview[]>([]);
  existingPostMedia = signal<LocalMediaPreview[]>([]);

  suggestedHashtags = signal<string[]>([
    'marketspase',
    'campaign',
    'productdrop',
    'sales',
    'creatorchallenge',
    'growth'
  ]);

  suggestedTopics = signal<string[]>([
    'Fresh campaign update: what is landing best with our audience this week?',
    'New product live. Here is why customers are already paying attention.',
    'Challenge time: show us how you would promote this creatively.',
    'Behind the scenes of what moved conversions for us today.'
  ]);

  userCampaigns = signal<CampaignOption[]>([]);
  stores = signal<StoreOption[]>([]);
  storeProducts = signal<ProductOption[]>([]);
  selectedCampaign = signal<CampaignOption | null>(null);
  selectedProduct = signal<ProductOption | null>(null);

  postData = {
    content: '',
    campaignId: '',
    productId: '',
    postAnonymously: false,
    disableComments: false,
    allowExternalShare: true
  };

  isEditMode = computed(() => !!this.postId());

  sourceMedia = computed<LocalMediaPreview[]>(() => {
    if (this.uploadedMedia().length) return this.uploadedMedia();
    if (this.existingPostMedia().length) return this.existingPostMedia();

    if (this.sourceType() === 'campaign' && this.selectedCampaign()) {
      const campaign = this.selectedCampaign()!;
      return [{
        url: campaign.mediaUrl,
        type: campaign.mediaType === 'video' ? 'video' : 'image',
        thumbnail: campaign.thumbnailUrl,
        altText: campaign.title,
        source: 'linked'
      }];
    }

    if (this.sourceType() === 'product' && this.selectedProduct()) {
      return (this.selectedProduct()?.images || []).slice(0, 6).map((image) => ({
        url: image.url,
        type: 'image',
        altText: image.altText || this.selectedProduct()?.name,
        source: 'linked'
      }));
    }

    return [];
  });

  previewPost = computed<FeedPost>(() => {
    const previewType: FeedPost['type'] = this.sourceType() === 'product'
      ? 'product'
      : this.challengeTag()
        ? 'challenge'
        : this.sourceType() === 'campaign'
          ? 'campaign'
          : 'story';

    return {
      _id: this.postId() || 'preview-post',
      author: this.postData.postAnonymously ? null : {
        _id: this.user()?._id || 'preview-user',
        displayName: this.user()?.displayName || 'You',
        username: this.user()?.username || 'you',
        avatar: this.user()?.avatar || 'img/avatar.png',
        role: this.user()?.role || 'marketer',
        rating: this.user()?.rating || 0,
        badge: ''
      },
      content: this.postData.content,
      source: this.sourceType(),
      type: previewType,
      campaign: this.selectedCampaign() ? {
        campaignId: this.selectedCampaign()?._id,
        name: this.selectedCampaign()?.title || '',
        budget: this.selectedCampaign()?.budget || 0,
        status: this.selectedCampaign()?.status || '',
        progress: this.selectedCampaign()?.progress || 0,
        spentBudget: this.selectedCampaign()?.spentBudget || 0,
        mediaUrl: this.selectedCampaign()?.mediaUrl,
        mediaType: this.selectedCampaign()?.mediaType,
        thumbnailUrl: this.selectedCampaign()?.thumbnailUrl
      } : undefined,
      product: this.selectedProduct() ? {
        productId: this.selectedProduct()?._id,
        name: this.selectedProduct()?.name,
        price: this.selectedProduct()?.price,
        originalPrice: this.selectedProduct()?.originalPrice,
        currency: this.selectedProduct()?.currency || 'NGN',
        category: this.selectedProduct()?.category,
        description: this.selectedProduct()?.description,
        storeName: this.selectedProduct()?.store?.name,
        storeLink: this.selectedProduct()?.store?.storeLink
      } : undefined,
      challenge: this.challengeTag() ? {
        tag: this.challengeTag(),
        title: this.challengeTitle() || `#${this.challengeTag()} challenge`,
        rewardLabel: this.challengeReward() || ''
      } : null,
      media: this.sourceMedia(),
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      chatCount: 0,
      isLiked: false,
      isSaved: false,
      hashtags: this.hashtags().map((tag) => ({ tag })),
      createdAt: new Date().toISOString(),
      isFeatured: false,
      settings: {
        postAnonymously: this.postData.postAnonymously,
        disableComments: this.postData.disableComments,
        allowExternalShare: this.postData.allowExternalShare
      }
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postId.set(id);
      this.loadPost(id);
    }

    this.loadUserCampaigns();
    this.loadStores();
  }

  loadUserCampaigns(): void {
    const currentUser = this.user();
    if (!currentUser?._id || currentUser.role !== 'marketer') return;

    this.isLoadingCampaigns.set(true);
    this.feedService.getMarketerCampaigns(currentUser._id).subscribe({
      next: (response) => {
        const campaigns = response?.data?.campaigns || response?.data || response?.campaigns || [];
        this.userCampaigns.set((campaigns || []).map((campaign: any) => ({
          _id: campaign._id,
          title: campaign.title || 'Untitled campaign',
          mediaUrl: campaign.mediaUrl || '',
          mediaType: campaign.mediaType || 'image',
          thumbnailUrl: campaign.thumbnailUrl,
          status: campaign.status || 'draft',
          budget: campaign.budget || 0,
          spentBudget: campaign.spentBudget || 0,
          progress: campaign.progress || 0
        })));
        if (this.postData.campaignId) {
          this.selectedCampaign.set(this.userCampaigns().find((campaign) => campaign._id === this.postData.campaignId) || null);
        }
        this.isLoadingCampaigns.set(false);
      },
      error: () => {
        this.isLoadingCampaigns.set(false);
        this.snackBar.open('Failed to load campaigns', 'Dismiss', { duration: 3000 });
      }
    });
  }

  loadStores(): void {
    const currentUser = this.user();
    if (!currentUser?._id || currentUser.role !== 'marketer') return;

    this.isLoadingStores.set(true);
    this.storeService.getStores(currentUser._id).subscribe({
      next: (stores) => {
        const mappedStores = (stores || []).map((store: any) => ({
          _id: store._id,
          name: store.name,
          storeLink: store.storeLink
        }));
        this.stores.set(mappedStores);

        const initialStoreId = this.currentStoreId() || mappedStores[0]?._id || '';
        this.currentStoreId.set(initialStoreId);
        if (initialStoreId) {
          this.loadPublishedProducts(initialStoreId);
        }

        this.isLoadingStores.set(false);
      },
      error: () => {
        this.isLoadingStores.set(false);
        this.snackBar.open('Failed to load stores', 'Dismiss', { duration: 3000 });
      }
    });
  }

  loadPublishedProducts(storeId: string): void {
    if (!storeId) return;

    this.isLoadingProducts.set(true);
    this.currentStoreId.set(storeId);
    this.productService.getPublishedProducts(storeId, { page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        const products = response?.data || response?.products || [];
        this.storeProducts.set((products || []).map((product: any) => ({
          _id: product._id,
          name: product.name,
          price: product.price || 0,
          originalPrice: product.originalPrice || 0,
          currency: product.currency || 'NGN',
          category: product.category || '',
          description: product.description || '',
          images: product.images || (product.mainImage ? [{ url: product.mainImage, isMain: true }] : []),
          store: product.store
        })));
        if (this.postData.productId) {
          this.selectedProduct.set(this.storeProducts().find((product) => product._id === this.postData.productId) || null);
        }
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.isLoadingProducts.set(false);
        this.snackBar.open('Failed to load published products', 'Dismiss', { duration: 3000 });
      }
    });
  }

  loadPost(id: string): void {
    this.isLoadingPost.set(true);
    this.feedService.getPostById(id).subscribe({
      next: (post) => {
        this.postData.content = post.content || '';
        this.postData.campaignId = post.campaign?.campaignId || '';
        this.postData.productId = post.product?.productId || '';
        this.postData.postAnonymously = !!post.settings?.postAnonymously;
        this.postData.disableComments = !!post.settings?.disableComments;
        this.postData.allowExternalShare = post.settings?.allowExternalShare !== false;
        this.characterCount.set(this.postData.content.length);
        this.hashtags.set((post.hashtags || []).map((tag: any) => typeof tag === 'string' ? tag : tag?.tag).filter(Boolean));
        this.challengeTag.set(post.challenge?.tag || '');
        this.challengeTitle.set(post.challenge?.title || '');
        this.challengeReward.set(post.challenge?.rewardLabel || '');
        this.sourceType.set((post.source as any) || (post.product ? 'product' : post.campaign ? 'campaign' : 'manual'));
        this.existingPostMedia.set((post.media || []).map((media) => ({
          url: media.url,
          type: (media.type === 'video' ? 'video' : media.type === 'document' ? 'document' : 'image') as 'image' | 'video' | 'document',
          thumbnail: media.thumbnail,
          altText: media.altText,
          source: 'linked'
        })));

        if (post.campaign?.campaignId) {
          const match = this.userCampaigns().find((campaign) => campaign._id === post.campaign?.campaignId);
          if (match) this.selectedCampaign.set(match);
        }

        if (post.product?.storeId) {
          this.currentStoreId.set(post.product.storeId);
          this.loadPublishedProducts(post.product.storeId);
        }

        this.isLoadingPost.set(false);
      },
      error: () => {
        this.isLoadingPost.set(false);
        this.snackBar.open('Could not load the post for editing', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/dashboard/community/feeds']);
      }
    });
  }

  onSourceChange(source: 'campaign' | 'product' | 'manual'): void {
    if (this.isEditMode()) return;
    this.sourceType.set(source);
    this.postData.campaignId = '';
    this.postData.productId = '';
    this.selectedCampaign.set(null);
    this.selectedProduct.set(null);
    this.existingPostMedia.set([]);
    this.markDirty();
  }

  onCampaignSelect(campaignId: string): void {
    this.postData.campaignId = campaignId;
    this.selectedCampaign.set(this.userCampaigns().find((campaign) => campaign._id === campaignId) || null);
    this.markDirty();
  }

  onStoreSelect(storeId: string): void {
    this.selectedProduct.set(null);
    this.postData.productId = '';
    this.loadPublishedProducts(storeId);
    this.markDirty();
  }

  onProductSelect(productId: string): void {
    this.postData.productId = productId;
    this.selectedProduct.set(this.storeProducts().find((product) => product._id === productId) || null);
    this.markDirty();
  }

  onContentInput(content: string): void {
    this.characterCount.set(content.length);
    this.markDirty();
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []).slice(0, 6);
    if (!files.length) return;

    const nextMedia = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: (file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'document' : 'image') as 'image' | 'video' | 'document',
      altText: file.name,
      source: 'upload' as const
    }));

    this.uploadedMedia.set(nextMedia);
    this.markDirty();
  }

  removeMedia(index: number): void {
    const current = [...this.uploadedMedia()];
    const [removed] = current.splice(index, 1);
    if (removed?.source === 'upload' && removed.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url);
    }
    this.uploadedMedia.set(current);
    this.markDirty();
  }

  addHashtag(tag: string): void {
    const cleaned = tag.trim().replace(/^#/, '').toLowerCase();
    if (!cleaned || this.hashtags().includes(cleaned)) return;
    this.hashtags.update((current) => [...current, cleaned]);
    this.hashtagInput.set('');
    this.markDirty();
  }

  removeHashtag(index: number): void {
    this.hashtags.update((current) => current.filter((_, currentIndex) => currentIndex !== index));
    this.markDirty();
  }

  addSuggestedHashtag(tag: string): void {
    this.addHashtag(tag);
  }

  applySuggestion(topic: string): void {
    this.postData.content = topic;
    this.characterCount.set(topic.length);
    this.markDirty();
  }

  togglePreview(): void {
    this.showPreview.update((value) => !value);
  }

  isFormValid(): boolean {
    const hasContent = this.postData.content.trim().length >= 10;
    const hasMedia = this.sourceMedia().length > 0;

    if (this.sourceType() === 'campaign') {
      return !!this.postData.campaignId && (hasContent || hasMedia);
    }

    if (this.sourceType() === 'product') {
      return !!this.postData.productId && (hasContent || hasMedia);
    }

    return hasContent || hasMedia;
  }

  onSubmit(): void {
    if (this.isSubmitting() || !this.isFormValid()) return;

    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      this.feedService.editPost(this.postId()!, {
        content: this.postData.content,
        hashtags: this.hashtags(),
        settings: {
          postAnonymously: this.postData.postAnonymously,
          disableComments: this.postData.disableComments,
          allowExternalShare: this.postData.allowExternalShare
        },
        challenge: this.challengeTag() ? {
          tag: this.challengeTag(),
          title: this.challengeTitle(),
          rewardLabel: this.challengeReward()
        } : null
      })
        .pipe(finalize(() => this.isSubmitting.set(false)))
        .subscribe({
          next: () => {
            this.snackBar.open('Post updated successfully', 'OK', { duration: 2500 });
            this.router.navigate(['/dashboard/community/feeds']);
          },
          error: () => {
            this.snackBar.open('Failed to update post', 'Dismiss', { duration: 3000 });
          }
        });
      return;
    }

    const payload = new FormData();
    payload.append('content', this.postData.content);
    payload.append('source', this.sourceType());
    if (this.postData.campaignId) payload.append('campaignId', this.postData.campaignId);
    if (this.postData.productId) payload.append('productId', this.postData.productId);
    payload.append('hashtags', JSON.stringify(this.hashtags().map((tag) => ({ tag }))));
    payload.append('settings', JSON.stringify({
      postAnonymously: this.postData.postAnonymously,
      disableComments: this.postData.disableComments,
      allowExternalShare: this.postData.allowExternalShare
    }));

    if (this.challengeTag()) {
      payload.append('challenge', JSON.stringify({
        tag: this.challengeTag(),
        title: this.challengeTitle(),
        rewardLabel: this.challengeReward()
      }));
    }

    this.uploadedMedia().forEach((media) => {
      if (media.file) {
        payload.append('media', media.file);
      }
    });

    this.feedService.createPost(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Post published successfully', 'OK', { duration: 2500 });
          this.router.navigate(['/dashboard/community/feeds']);
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Failed to publish post', 'Dismiss', { duration: 3200 });
        }
      });
  }

  onDiscard(): void {
    if (this.isDirty()) {
      const confirmed = window.confirm('You have unsaved changes. Leave this composer?');
      if (!confirmed) return;
    }

    this.cleanupUploads();
    this.router.navigate(['/dashboard/community/feeds']);
  }

  markDirty(): void {
    this.isDirty.set(true);
  }

  private cleanupUploads(): void {
    this.uploadedMedia().forEach((media) => {
      if (media.url.startsWith('blob:')) {
        URL.revokeObjectURL(media.url);
      }
    });
  }
}
