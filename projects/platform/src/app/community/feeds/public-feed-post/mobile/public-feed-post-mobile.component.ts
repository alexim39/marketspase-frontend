import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeedPostCardComponent } from '../../feed-post-card/feed-post-card.component';
import { FeedService } from '../../feed.service';
import { PublicFeedPostComponent } from '../../public-feed-post.component';

@Component({
  selector: 'app-public-feed-post-mobile',
  standalone: true,
  providers: [FeedService],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FeedPostCardComponent,
  ],
  templateUrl: './public-feed-post-mobile.component.html',
  styleUrls: ['./public-feed-post-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicFeedPostMobileComponent extends PublicFeedPostComponent {
  protected readonly hasPost = computed(() => !!this.post());
  protected readonly isSignedIn = computed(() => !!this.user()?._id);
  protected readonly authorLabel = computed(() => {
    const author = this.post()?.author;
    if (!author) return 'MarketSpase community';
    return author.displayName || author.username || 'MarketSpase creator';
  });
}
