import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LiveActivity } from '../../feed.service';

@Component({
  selector: 'app-feed-live-activity-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './feed-live-activity-toast.component.html',
  styleUrls: ['./feed-live-activity-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedLiveActivityToastComponent implements OnDestroy {
  readonly activities = input<LiveActivity[]>([]);
  readonly activitySelected = output<LiveActivity>();

  private readonly dismissedIds = signal<Set<string>>(new Set());
  protected readonly isLeaving = signal(false);

  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly visibleActivity = computed(() => {
    const dismissed = this.dismissedIds();
    return this.activities().find((activity) => activity?.id && !dismissed.has(activity.id)) || null;
  });

  constructor() {
    effect(() => {
      const activity = this.visibleActivity();
      this.clearTimers();
      this.isLeaving.set(false);

      if (!activity) {
        return;
      }

      this.autoDismissTimer = setTimeout(() => this.dismiss(activity), 5600);
    });
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected openActivity(activity: LiveActivity): void {
    this.activitySelected.emit(activity);
    this.dismiss(activity);
  }

  protected dismiss(activity: LiveActivity, event?: Event): void {
    event?.stopPropagation();
    if (!activity?.id) return;
    if (this.isLeaving()) return;

    this.autoDismissTimer && clearTimeout(this.autoDismissTimer);
    this.autoDismissTimer = null;
    this.isLeaving.set(true);

    this.leaveTimer = setTimeout(() => {
      this.dismissedIds.update((current) => {
        const next = new Set(current);
        next.add(activity.id);
        return next;
      });
      this.isLeaving.set(false);
    }, 220);
  }

  protected iconFor(type: LiveActivity['type']): string {
    const icons: Record<LiveActivity['type'], string> = {
      like: 'favorite',
      comment: 'mode_comment',
      post: 'dynamic_feed',
      earnings: 'paid',
      forum: 'forum',
      campaign: 'campaign',
      product: 'shopping_bag',
    };

    return icons[type] || 'notifications';
  }

  protected labelFor(type: LiveActivity['type']): string {
    const labels: Record<LiveActivity['type'], string> = {
      like: 'New reaction',
      comment: 'New comment',
      post: 'New post',
      earnings: 'New earning',
      forum: 'Forum update',
      campaign: 'New campaign',
      product: 'New product',
    };

    return labels[type] || 'Live update';
  }

  private clearTimers(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
  }
}
