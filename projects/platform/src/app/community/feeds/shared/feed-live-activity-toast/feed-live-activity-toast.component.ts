import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, input, output, signal, PLATFORM_ID, inject, HostBinding } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LiveActivity } from '../../feed.service';

// --- Constants ---
const TOAST_DISPLAY_DURATION_MS = 5200;       // How long a toast stays visible before auto-dismiss
const EXIT_ANIM_DURATION_MS = 260;            // Exit animation duration (matches CSS keyframes)
const COOLDOWN_BETWEEN_TOASTS_MS = 30000;     // Minimum gap between consecutive toasts
const SESSION_WINDOW_MS = 5 * 60 * 1000;      // 5-minute rolling session window
const MAX_TOASTS_PER_SESSION_WINDOW = 3;       // Maximum toasts shown in one session window

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

  // --- Private state signals ---
  private readonly dismissedIds = signal<Set<string>>(new Set());
  private readonly cooldownActive = signal(false);
  private readonly sessionToastCount = signal(0);
  private readonly sessionWindowStart = signal(Date.now());
  private readonly hasManuallyDismissed = signal(false);

  // --- Protected state (used in template) ---
  protected readonly isLeaving = signal(false);

  // --- Timers ---
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionResetTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * The next eligible activity to display.
   *
   * Returns null when:
   *  - All activities have been dismissed
   *  - Cooldown is active (30s gap between toasts)
   *  - Session cap reached (3 per 5 minutes)
   *  - User manually dismissed a toast (resets when new activities arrive)
   */
  protected readonly visibleActivity = computed(() => {
    const dismissed = this.dismissedIds();
    const cooldown = this.cooldownActive();
    const capped = this.sessionToastCount() >= MAX_TOASTS_PER_SESSION_WINDOW;
    const manualDismissed = this.hasManuallyDismissed();

    if (cooldown || capped || manualDismissed) {
      return null;
    }

    const activities = this.activities();

    // Pick the first undismissed activity
    for (const a of activities) {
      if (a?.id && !dismissed.has(a.id)) {
        return a;
      }
    }

    return null;
  });

  /**
   * Groups remaining undismissed activities by type for the "N others" badge.
   * Derived separately to avoid writing to signals inside a computed().
   */
  protected readonly groupedCounts = computed<Record<string, { label: string; count: number; latestTime: string }>>(() => {
    const dismissed = this.dismissedIds();
    const visible = this.visibleActivity();
    const activities = this.activities();

    if (!visible || !visible.id) return {};

    // Count undismissed activities of the same type as the visible one
    let count = 0;
    let latestTime = visible.time;
    for (const a of activities) {
      if (!a?.id || dismissed.has(a.id)) continue;
      if (a.type === visible.type) {
        count++;
        // Track the latest time among this group
        if (a.time > latestTime) latestTime = a.time;
      }
    }

    if (count <= 1) return {};

    return {
      [visible.type]: {
        label: this.labelFor(visible.type),
        count,
        latestTime,
      },
    };
  });

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (!isBrowser) return;

    // React to visibleActivity changes: start auto-dismiss timer
    effect(() => {
      const activity = this.visibleActivity();
      this.clearTimers();
      this.isLeaving.set(false);

      if (!activity) {
        return;
      }

      this.autoDismissTimer = setTimeout(
        () => this.dismiss(activity),
        TOAST_DISPLAY_DURATION_MS,
      );
    });

    // Rolling session window: reset counter every 5 minutes
    this.sessionResetTimer = setInterval(() => {
      this.sessionWindowStart.set(Date.now());
      this.sessionToastCount.set(0);
    }, SESSION_WINDOW_MS);
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  // --- Public API ---

  protected openActivity(activity: LiveActivity): void {
    this.activitySelected.emit(activity);
    this.dismiss(activity);
  }

  protected dismiss(activity: LiveActivity, event?: Event): void {
    event?.stopPropagation();
    if (!activity?.id) return;
    if (this.isLeaving()) return;

    // Kill the auto-dismiss timer
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    // Play exit animation
    this.isLeaving.set(true);
    this.sessionToastCount.update((c) => c + 1);

    this.leaveTimer = setTimeout(() => {
      this.dismissedIds.update((current) => {
        const next = new Set(current);
        next.add(activity.id);

        // Manual dismiss (clicking X) clears the entire queue
        if (event?.type === 'click') {
          this.hasManuallyDismissed.set(true);
        }

        return next;
      });
      this.isLeaving.set(false);

      // Enforce cooldown before showing next toast
      this.startCooldown();
    }, EXIT_ANIM_DURATION_MS);
  }

  // --- Grouping helpers ---

  protected groupSuffix(activity: LiveActivity): string | null {
    const groups = this.groupedCounts();
    const group = groups[activity.type];
    if (!group || group.count <= 1) return null;
    const others = group.count - 1;
    return `+${others} ${others === 1 ? 'other' : 'others'}`;
  }

  // --- Icon / label maps ---

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

  // --- Internal ---

  private startCooldown(): void {
    this.cooldownActive.set(true);
    this.cooldownTimer = setTimeout(() => {
      this.cooldownActive.set(false);
      this.cooldownTimer = null;
    }, COOLDOWN_BETWEEN_TOASTS_MS);
  }

  /** Called when new activities arrive to reset the "dismiss all" state */
  protected resetDismissAll(): void {
    this.hasManuallyDismissed.set(false);
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

  private clearAllTimers(): void {
    this.clearTimers();
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    if (this.sessionResetTimer) {
      clearInterval(this.sessionResetTimer);
      this.sessionResetTimer = null;
    }
  }
}
