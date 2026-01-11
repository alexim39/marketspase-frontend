import { Component, Inject, OnInit, signal, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  MAT_DIALOG_DATA, 
  MatDialogModule, 
  MatDialogRef 
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CampaignService } from '../../../campaign/campaign.service';
import { AdminService } from '../../../common/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Campaign, Promoter, Promotion } from '../submitted-promotion-list/submitted-promotion-list.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';

interface ViewState {
  scale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

@Component({
  selector: 'app-proof-media-dialog',
  standalone: true,
  providers: [CampaignService],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './proof-media-dialog.component.html',
  styleUrls: ['./proof-media-dialog.component.scss']
})
export class ProofMediaDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('imageWrapper') imageWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('imageViewer') imageViewer!: ElementRef<HTMLDivElement>;

  readonly promotion: Promotion;
  readonly campaigns = signal<Campaign[]>([]);
  readonly promoters = signal<Promoter[]>([]);
  readonly selectedImageIndex = signal(0);
  readonly isLoading = signal(false);
  
  // Zoom and pan state
  readonly viewState = signal<ViewState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
  });

  // Zoom levels
  readonly zoomLevels = [0.5, 0.75, 1, 1.5, 2, 3, 4, 5];
  readonly minZoom = 0.5;
  readonly maxZoom = 5;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      promotion: Promotion;
      campaigns: Campaign[];
      onValidate: (promotion: Promotion) => void;
      onReject: (promotion: Promotion) => void;
    },
    private dialogRef: MatDialogRef<ProofMediaDialogComponent>,
    private campaignService: CampaignService,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.promotion = data.promotion;
    if (data.campaigns) {
      this.campaigns.set(data.campaigns);
    }
  }

  ngOnInit(): void {
    if (this.campaigns().length === 0) {
      this.loadCampaigns();
    }
  }

  ngAfterViewInit(): void {
    this.setupZoomAndPan();
  }

  private setupZoomAndPan(): void {
    const viewer = this.imageViewer?.nativeElement;
    const wrapper = this.imageWrapper?.nativeElement;
    
    if (!viewer || !wrapper) return;

    // Mouse wheel zoom
    viewer.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
    // Mouse drag for panning
    viewer.addEventListener('mousedown', this.startDrag.bind(this));
    viewer.addEventListener('mousemove', this.drag.bind(this));
    viewer.addEventListener('mouseup', this.endDrag.bind(this));
    viewer.addEventListener('mouseleave', this.endDrag.bind(this));
    
    // Touch events for mobile
    viewer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    viewer.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    viewer.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const state = this.viewState();
    
    switch(event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
      case '_':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.resetView();
        break;
      case 'Escape':
        if (state.scale > 1) {
          event.preventDefault();
          this.resetView();
        } else {
          this.onClose();
        }
        break;
      case ' ':
        if (event.target === document.body) {
          event.preventDefault();
          this.resetView();
        }
        break;
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    if (event.ctrlKey || event.metaKey) {
      // Zoom with Ctrl/Cmd + Wheel
      const delta = event.deltaY > 0 ? -0.2 : 0.2;
      this.zoomAtPosition(delta, event.clientX, event.clientY);
    } else {
      // Pan with wheel
      this.viewState.update(state => ({
        ...state,
        translateX: state.translateX - event.deltaX * 0.5,
        translateY: state.translateY - event.deltaY * 0.5
      }));
    }
  }

  private startDrag(event: MouseEvent): void {
    const state = this.viewState();
    if (state.scale <= 1) return;
    
    event.preventDefault();
    this.viewState.update(state => ({
      ...state,
      isDragging: true,
      lastX: event.clientX,
      lastY: event.clientY
    }));
  }

  private drag(event: MouseEvent): void {
    const state = this.viewState();
    if (!state.isDragging || state.scale <= 1) return;
    
    event.preventDefault();
    const deltaX = event.clientX - state.lastX;
    const deltaY = event.clientY - state.lastY;
    
    this.viewState.update(s => ({
      ...s,
      translateX: s.translateX + deltaX,
      translateY: s.translateY + deltaY,
      lastX: event.clientX,
      lastY: event.clientY
    }));
  }

  private endDrag(): void {
    this.viewState.update(state => ({
      ...state,
      isDragging: false
    }));
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // Single touch - prepare for panning
      const state = this.viewState();
      if (state.scale <= 1) return;
      
      event.preventDefault();
      const touch = event.touches[0];
      this.viewState.update(state => ({
        ...state,
        isDragging: true,
        lastX: touch.clientX,
        lastY: touch.clientY
      }));
    } else if (event.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      event.preventDefault();
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    const state = this.viewState();
    
    if (event.touches.length === 1 && state.isDragging && state.scale > 1) {
      // Single touch - panning
      event.preventDefault();
      const touch = event.touches[0];
      const deltaX = touch.clientX - state.lastX;
      const deltaY = touch.clientY - state.lastY;
      
      this.viewState.update(s => ({
        ...s,
        translateX: s.translateX + deltaX,
        translateY: s.translateY + deltaY,
        lastX: touch.clientX,
        lastY: touch.clientY
      }));
    }
    // Note: Pinch zoom would require more complex implementation
  }

  private handleTouchEnd(): void {
    this.viewState.update(state => ({
      ...state,
      isDragging: false
    }));
  }

  // Zoom methods
  zoomIn(): void {
    const state = this.viewState();
    if (state.scale < this.maxZoom) {
      const newScale = Math.min(this.maxZoom, state.scale + 0.5);
      this.viewState.update(s => ({ ...s, scale: newScale }));
    }
  }

  zoomOut(): void {
    const state = this.viewState();
    if (state.scale > this.minZoom) {
      const newScale = Math.max(this.minZoom, state.scale - 0.5);
      this.viewState.update(s => ({ ...s, scale: newScale }));
    }
  }

  zoomAtPosition(delta: number, clientX: number, clientY: number): void {
    const state = this.viewState();
    const newScale = Math.min(this.maxZoom, Math.max(this.minZoom, state.scale + delta));
    
    if (newScale === state.scale) return;
    
    // Calculate the point to zoom around (mouse position relative to image)
    const viewer = this.imageViewer?.nativeElement;
    if (!viewer) return;
    
    const rect = viewer.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    // Calculate new translate values to keep the point under cursor fixed
    const scaleChange = newScale - state.scale;
    const translateX = state.translateX - (relativeX - rect.width / 2) * (scaleChange / state.scale);
    const translateY = state.translateY - (relativeY - rect.height / 2) * (scaleChange / state.scale);
    
    this.viewState.update(s => ({
      ...s,
      scale: newScale,
      translateX,
      translateY
    }));
  }

  setZoomLevel(level: number): void {
    this.viewState.update(state => ({
      ...state,
      scale: level,
      translateX: 0,
      translateY: 0
    }));
  }

  resetView(): void {
    this.viewState.update(state => ({
      ...state,
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false
    }));
  }

  getTransform(): string {
    const state = this.viewState();
    return `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  }

  getZoomPercentage(): number {
    return Math.round(this.viewState().scale * 100);
  }

  isAtMinZoom(): boolean {
    return this.viewState().scale <= this.minZoom;
  }

  isAtMaxZoom(): boolean {
    return this.viewState().scale >= this.maxZoom;
  }

  private loadCampaigns(): void {
    this.campaignService.getAppCampaigns().subscribe({
      next: (response) => {
        if (response.success) {
        //console.log('Setting campaigns from dialog data', response.data);
          this.campaigns.set(response.data);
        }
      },
      error: (error) => console.error('Error fetching campaigns:', error)
    });
  }

  getCampaignTitle(): string {
    const campaign = this.campaigns().find(c => 
      c._id === (typeof this.promotion.campaign === 'string' 
        ? this.promotion.campaign 
        : this.promotion.campaign._id)
    );
    return campaign?.title || 'Unknown Campaign';
  }

 getCampaignTier(): string {
    const campaignId = typeof this.promotion.campaign === 'string'
      ? this.promotion.campaign
      : this.promotion.campaign._id?.toString();

    const campaign = this.campaigns().find(c =>
      c._id.toString() === campaignId
    );

    return campaign?.payoutTierId || 'Unknown Tier';
  }

 confirmUserViews(views: number): string {
    // Safely extract the campaign ID (handles both populated object and string reference)
    const campaignId = typeof this.promotion.campaign === 'string'
      ? this.promotion.campaign
      : this.promotion.campaign?._id?.toString();

    if (!campaignId) {
      return 'Invalid campaign ID'; // Invalid promotion reference
    }

    // Find the matching campaign from the cached/loaded campaigns
    const campaign = this.campaigns().find(
      c => c._id.toString() === campaignId
    );

    if (!campaign) {
      return 'Campaign not found'; // Campaign not found
    }

    const min = campaign?.minViewsPerPromotion ?? 0;

    // Only enforce the minimum views requirement
    // Exceeding maxViewsPerPromotion (if set) is allowed and considered valid
    const isValid = views >= min;

    return isValid ? 'Valid views' : 'Invalid views';
  }

  getPromoterName(): string {
    if (typeof this.promotion.promoter !== 'string') {
      return this.promotion.promoter.displayName;
    }
    return 'Loading...';
  }

  getPromoterEmail(): string {
    if (typeof this.promotion.promoter !== 'string') {
      return this.promotion.promoter.email;
    }
    return 'Loading...';
  }

  timeSinceSubmission(): string {
    if (!this.promotion.submittedAt) return '';
    
    const submittedDate = new Date(this.promotion.submittedAt);
    const now = new Date();
    const diffMs = now.getTime() - submittedDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  }

  // Image navigation methods
  selectImage(index: number): void {
    if (index >= 0 && index < this.promotion.proofMedia.length) {
      this.selectedImageIndex.set(index);
      this.resetView();
    }
  }

  nextImage(): void {
    if (this.selectedImageIndex() < this.promotion.proofMedia.length - 1) {
      this.selectedImageIndex.update(index => index + 1);
      this.resetView();
    }
  }

  previousImage(): void {
    if (this.selectedImageIndex() > 0) {
      this.selectedImageIndex.update(index => index - 1);
      this.resetView();
    }
  }

  downloadImage(): void {
    if (this.promotion.proofMedia.length > 0) {
      const imageUrl = this.promotion.proofMedia[this.selectedImageIndex()];
      // Derive extension as you already do
      let ext = 'jpg';
      try {
        const parts = imageUrl.split('?')[0].split('.');
        ext = parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
      } catch {
        ext = 'jpg';
      }

      fetch(imageUrl, { mode: 'cors' })
        .then(res => {
          if (!res.ok) throw new Error('Network response not ok');
          return res.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `proof-${this.promotion.upi}-${this.selectedImageIndex() + 1}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          this.snackBar.open('Image download started', 'Close', { duration: 2000 });
        })
        .catch(err => {
          console.error(err);
          this.snackBar.open('Failed to download image', 'Close', { duration: 2000 });
        });
    }
  }

  validatePromotion(): void {
    this.isLoading.set(true);
    this.data.onValidate(this.promotion);
    // Close dialog with result
    //this.dialogRef.close('validated');
  }



  rejectPromotion(): void {
    this.isLoading.set(true);
    this.data.onReject(this.promotion);
    // Close dialog with result
    //this.dialogRef.close('rejected');
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getTimeDifference(): string {
    if (!this.promotion.createdAt || !this.promotion.submittedAt) {
      return 'N/A';
    }
    
    const createdAt = new Date(this.promotion.createdAt);
    const submittedAt = new Date(this.promotion.submittedAt);
    const diffMs = submittedAt.getTime() - createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Less than a minute';
    }
  }
}