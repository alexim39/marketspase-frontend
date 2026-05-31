import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedPostCardComponent } from '../../feed-post-card/feed-post-card.component';
import { FeedService } from '../../feed.service';
import { ProductService } from '../../../../store/marketer/products/product.service';
import { StoreService } from '../../../../store/services/store.service';
import { CreateFeedPageComponent } from '../create-feed.component';

@Component({
  selector: 'app-create-feed-mobile',
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
    MatCheckboxModule,
  ],
  templateUrl: './create-feed-mobile.component.html',
  styleUrls: ['./create-feed-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateFeedMobileComponent extends CreateFeedPageComponent {
  protected readonly isPreviewOpen = signal(false);

  protected readonly sourceIsComplete = computed(() => {
    if (this.sourceType() === 'campaign') return !!this.postData.campaignId;
    if (this.sourceType() === 'product') return !!this.postData.productId;
    return true;
  });

  protected readonly storyIsReady = computed(() => {
    return this.postData.content.trim().length >= 10 || this.sourceMedia().length > 0;
  });

  protected readonly completionLabel = computed(() => {
    const completeCount = [
      this.sourceIsComplete(),
      this.storyIsReady(),
      this.sourceMedia().length > 0 || this.sourceType() === 'manual',
      this.isFormValid(),
    ].filter(Boolean).length;

    return `${completeCount}/4 ready`;
  });

  protected readonly sourceSummary = computed(() => {
    const campaign = this.selectedCampaign();
    if (campaign) return campaign.title;

    const product = this.selectedProduct();
    if (product) return product.name;

    if (this.sourceType() === 'manual') return 'Manual post';

    return 'Choose a source';
  });

  protected openPreview(): void {
    this.isPreviewOpen.set(true);
  }

  protected closePreview(): void {
    this.isPreviewOpen.set(false);
  }
}
