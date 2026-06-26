import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@shared/services/api';
import { CommentComponent } from '../../../comment/comment.component';
import { ForumMediaItem, ForumService } from '../../../forum.service';
import { SanitizeHtmlPipe } from '../../../../../common/pipes/sanitize-html.pipe';
import { ThreadDetailComponent } from '../thread-detail.component';

@Component({
  selector: 'app-thread-detail-mobile',
  standalone: true,
  providers: [ForumService, ApiService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommentComponent,
    SanitizeHtmlPipe,
  ],
  templateUrl: './thread-detail-mobile.component.html',
  styleUrls: ['./thread-detail-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreadDetailMobileComponent extends ThreadDetailComponent {
  protected readonly skeletonItems = [1, 2, 3];

  protected get mediaItems(): ForumMediaItem[] {
    if (this.thread?.mediaItems?.length) {
      return this.thread.mediaItems;
    }

    return this.thread?.media ? [this.thread.media] : [];
  }

  protected get visibleTags(): string[] {
    if (!this.thread) {
      return [];
    }

    return [
      ...(this.thread.tags || []),
      ...(this.thread.topicTags || []).map((topic) => `#${topic}`),
    ].slice(0, 10);
  }

  protected get hasComments(): boolean {
    return this.comments.length > 0;
  }

  protected focusCommentBox(): void {
    setTimeout(() => {
      document.getElementById('mobileCommentBox')?.focus();
    });
  }
}
