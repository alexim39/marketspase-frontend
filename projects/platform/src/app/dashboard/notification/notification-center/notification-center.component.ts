import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { IntersectionObserverDirective } from '../../../storefront/shared/directives/intersection-observer.directive';
import { UserService } from '../../../common/services/user.service';
import { Notification, NotificationPageInfo, NotificationService } from '../notification.service';
import { NotificationRealtimeService } from '../notification-realtime.service';
import { NotificationPreferencesService } from '../notification-preferences.service';
import { UserInterface } from '@shared/services';

type NotificationStatusFilter = 'all' | 'unread' | 'read';
type NotificationCategoryKey =
  | 'all'
  | 'campaign'
  | 'storefront'
  | 'orders'
  | 'escrow'
  | 'referral'
  | 'system'
  | 'promotions'
  | 'security'
  | 'forum'
  | 'payments'
  | 'gamification'
  | 'other';

type PriorityTone = 'all' | 'info' | 'success' | 'warning' | 'critical';

interface NotificationGroup {
  label: 'Today' | 'Yesterday' | 'Earlier';
  items: Notification[];
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule,
    IntersectionObserverDirective,
  ],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly realtime = inject(NotificationRealtimeService);
  private readonly prefsService = inject(NotificationPreferencesService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.userService.user;

  // Filters
  readonly statusFilter = signal<NotificationStatusFilter>('all');
  readonly categoryFilter = signal<NotificationCategoryKey>('all');
  readonly priorityFilter = signal<PriorityTone>('all');
  readonly searchTerm = signal<string>('');

  // Preferences
  readonly mutedCategories = signal<Set<string>>(new Set());

  // Paging state
  readonly items = signal<Notification[]>([]);
  readonly pageInfo = signal<NotificationPageInfo>({ hasNextPage: true, nextCursor: null });
  readonly loadingFirstPage = signal<boolean>(true);
  readonly loadingMore = signal<boolean>(false);
  readonly loadedOnce = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);

  // Selection (bulk actions)
  readonly selectionMode = signal<boolean>(false);
  readonly selectedIds = signal<Set<string>>(new Set());

  // Local search stream (debounced so typing stays cheap on mobile).
  private readonly searchInput$ = new Subject<string>();

  readonly categoryOptions: Array<{ key: NotificationCategoryKey; label: string }> = [
    { key: 'all', label: 'All categories' },
    { key: 'campaign', label: 'Campaigns' },
    { key: 'promotions', label: 'Promotions' },
    { key: 'payments', label: 'Payments' },
    { key: 'storefront', label: 'Storefront' },
    { key: 'orders', label: 'Orders' },
    { key: 'escrow', label: 'Escrow' },
    { key: 'referral', label: 'Referrals' },
    { key: 'forum', label: 'Community' },
    { key: 'gamification', label: 'Achievements' },
    { key: 'system', label: 'System' },
    { key: 'security', label: 'Security' },
    { key: 'other', label: 'Other' },
  ];

  readonly priorityOptions: Array<{ key: PriorityTone; label: string }> = [
    { key: 'all', label: 'All priorities' },
    { key: 'info', label: 'Info' },
    { key: 'success', label: 'Success' },
    { key: 'warning', label: 'Warning' },
    { key: 'critical', label: 'Critical' },
  ];

  readonly statusOptions: Array<{ key: NotificationStatusFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
  ];

  readonly effectiveSearch = signal<string>('');

  readonly filteredItems = computed(() => {
    const muted = this.mutedCategories();
    const status = this.statusFilter();
    const category = this.categoryFilter();
    const tone = this.priorityFilter();
    const q = this.effectiveSearch().trim().toLowerCase();

    return this.items().filter((n) => {
      const nCategory = this.categoryFor(n.type);
      if (muted.has(nCategory)) return false;

      if (status !== 'all' && n.status !== status) return false;
      if (category !== 'all' && nCategory !== category) return false;

      if (tone !== 'all' && this.priorityTone(n) !== tone) return false;

      if (q) {
        const hay = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  });

  readonly groups = computed<NotificationGroup[]>(() => this.groupByDay(this.filteredItems()));

  readonly unreadInViewCount = computed(() => this.filteredItems().filter((n) => n.status === 'unread').length);

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly allInViewSelected = computed(() => {
    const view = this.filteredItems();
    if (view.length === 0) return false;
    const selected = this.selectedIds();
    return view.every((n) => selected.has(n._id));
  });

  constructor() {
    // Debounce search input to keep the UI responsive on low-end devices.
    this.searchInput$
      .pipe(
        startWith(''),
        map((v) => String(v || '')),
        debounceTime(200),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((term) => this.effectiveSearch.set(term));

    // Load preferences first (best-effort), then fetch the first page.
    this.prefsService
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const muted = new Set<string>(res?.data?.mutedCategories || []);
        this.mutedCategories.set(muted);
        this.refresh();
      });

    // Realtime: insert new notifications at the top and keep list fresh.
    // Note: The bell already connects to realtime, but this is idempotent.
    toObservable(this.userService.user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u: UserInterface | null) => {
        const userId = u?._id;
        if (!userId) return;
        this.realtime.connect(userId);
      });

    this.realtime.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt) => {
        if (evt.kind === 'new') {
          const n = evt.notification;
          if (!n?._id) return;

          this.items.update((current) => {
            if (current.some((x) => x._id === n._id)) return current;
            return [n, ...current];
          });
          return;
        }

        if (evt.kind === 'updated') {
          const id = String(evt.notificationId || '');
          if (!id) return;
          const nextStatus = evt.status;
          if (!nextStatus) return;

          this.items.update((current) => current.map((n) => (n._id === id ? { ...n, status: nextStatus } : n)));
          return;
        }

        if (evt.kind === 'bulkUpdated') {
          if (evt.action === 'markAllAsRead') {
            this.items.update((current) => current.map((n) => ({ ...n, status: 'read' })));
          }
          return;
        }

        if (evt.kind === 'deleted') {
          const id = String(evt.notificationId || '');
          if (!id) return;

          this.items.update((current) => current.filter((n) => n._id !== id));
          this.selectedIds.update((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
          return;
        }

        if (evt.kind === 'bulkDeleted') {
          const ids = Array.isArray(evt.notificationIds) ? evt.notificationIds.map((x) => String(x)).filter(Boolean) : [];
          if (ids.length === 0) return;

          const idSet = new Set(ids);
          this.items.update((current) => current.filter((n) => !idSet.has(n._id)));
          this.selectedIds.update((current) => {
            const next = new Set(current);
            ids.forEach((id) => next.delete(id));
            return next;
          });
          return;
        }
      });

    // When filters change, reset to the first page.
    combineLatest([
      toObservable(this.statusFilter),
      toObservable(this.categoryFilter),
      toObservable(this.priorityFilter),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // If we haven't loaded anything yet, don't thrash.
        if (!this.loadedOnce()) return;
        this.refresh();
      });
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.searchInput$.next(value);
  }

  refresh(): void {
    this.loadingFirstPage.set(true);
    this.loadedOnce.set(false);
    this.items.set([]);
    this.pageInfo.set({ hasNextPage: true, nextCursor: null });
    this.selectionMode.set(false);
    this.selectedIds.set(new Set());
    this.loadNextPage();
  }

  loadNextPage(): void {
    const page = this.pageInfo();
    if (!page.hasNextPage) return;
    if (this.loadingMore()) return;

    // First page vs subsequent pages
    const isFirst = this.items().length === 0;
    if (!isFirst) this.loadingMore.set(true);

    const status = this.statusFilter() === 'all' ? null : this.statusFilter();

    this.notificationService
      .getNotificationsPage({
        cursor: page.nextCursor,
        limit: 20,
        status: status as any,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (!res?.success) {
            return;
          }

          const incoming: Notification[] = Array.isArray(res.data) ? res.data : [];
          const info: NotificationPageInfo | undefined = res.pageInfo;

          this.items.update((current) => {
            const seen = new Set(current.map((n) => n._id));
            const merged = [...current];
            for (const n of incoming) {
              if (!n?._id || seen.has(n._id)) continue;
              merged.push(n);
            }
            return merged;
          });

          if (info) {
            this.pageInfo.set({
              hasNextPage: Boolean(info.hasNextPage),
              nextCursor: info.nextCursor ?? null,
            });
          } else {
            // Legacy fallback: if backend didn't return pageInfo, stop paging.
            this.pageInfo.set({ hasNextPage: false, nextCursor: null });
          }
        },
        error: (err) => {
          console.error('Failed to load notifications page:', err);
          this.snackBar.open('Failed to load notifications. Please try again.', 'OK', { duration: 3500 });
        },
        complete: () => {
          this.loadedOnce.set(true);
          this.loadingFirstPage.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  onLoadMoreVisible(visible: boolean): void {
    if (!visible) return;
    this.loadNextPage();
  }

  toggleMuteCategory(categoryKey: string, muted: boolean): void {
    const next = new Set(this.mutedCategories());
    if (muted) next.add(categoryKey);
    else next.delete(categoryKey);

    this.mutedCategories.set(next);

    const prefs = this.prefsService.getCached();
    const mutedCategories = Array.from(next.values());
    const mutedTypes = prefs?.mutedTypes || [];

    this.prefsService.update({ mutedCategories, mutedTypes }).subscribe();
  }

  isCategoryMuted(categoryKey: string): boolean {
    return this.mutedCategories().has(categoryKey);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Optimistic: update list immediately.
        this.items.update((current) => current.map((n) => ({ ...n, status: 'read' })));
      },
      error: (err) => {
        console.error('Failed to mark all as read:', err);
        this.snackBar.open('Failed to mark all as read.', 'OK', { duration: 3000 });
      },
    });
  }

  enterSelectionMode(): void {
    this.selectionMode.set(true);
  }

  exitSelectionMode(): void {
    this.selectionMode.set(false);
    this.selectedIds.set(new Set());
  }

  isSelected(notificationId: string): boolean {
    if (!notificationId) return false;
    return this.selectedIds().has(notificationId);
  }

  toggleSelected(notificationId: string, selected: boolean): void {
    if (!notificationId) return;
    const next = new Set(this.selectedIds());
    if (selected) next.add(notificationId);
    else next.delete(notificationId);
    this.selectedIds.set(next);
  }

  toggleSelectAllInView(): void {
    const view = this.filteredItems();
    if (view.length === 0) return;

    const next = new Set(this.selectedIds());
    const allSelected = view.every((n) => next.has(n._id));

    if (allSelected) {
      view.forEach((n) => next.delete(n._id));
    } else {
      view.forEach((n) => next.add(n._id));
    }

    this.selectedIds.set(next);
  }

  onRowPrimaryAction(n: Notification): void {
    if (!n?._id) return;

    if (this.selectionMode()) {
      const nextSelected = !this.isSelected(n._id);
      this.toggleSelected(n._id, nextSelected);
      return;
    }

    this.onNotificationClick(n);
  }

  deleteOne(notificationId: string, ev?: Event): void {
    ev?.stopPropagation();
    ev?.preventDefault();

    if (!notificationId || this.deleting()) return;
    const ok = window.confirm('Delete this notification? This cannot be undone.');
    if (!ok) return;

    this.deleting.set(true);
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: (res: any) => {
        if (!res?.success) {
          this.snackBar.open('Failed to delete notification.', 'OK', { duration: 3000 });
          return;
        }

        this.items.update((current) => current.filter((n) => n._id !== notificationId));
        this.selectedIds.update((current) => {
          const next = new Set(current);
          next.delete(notificationId);
          return next;
        });
      },
      error: (err) => {
        console.error('Failed to delete notification:', err);
        this.snackBar.open('Failed to delete notification.', 'OK', { duration: 3000 });
      },
      complete: () => this.deleting.set(false),
    });
  }

  deleteSelected(): void {
    if (this.deleting()) return;
    const ids = Array.from(this.selectedIds().values());
    if (ids.length === 0) return;

    const ok = window.confirm(`Delete ${ids.length} notification(s)? This cannot be undone.`);
    if (!ok) return;

    this.deleting.set(true);
    const idSet = new Set(ids);

    this.notificationService.bulkDeleteNotifications(ids).subscribe({
      next: (res: any) => {
        if (!res?.success) {
          this.snackBar.open('Failed to delete notifications.', 'OK', { duration: 3000 });
          return;
        }

        this.items.update((current) => current.filter((n) => !idSet.has(n._id)));
        this.selectedIds.set(new Set());
        this.selectionMode.set(false);
        this.snackBar.open(`Deleted ${ids.length} notification(s).`, 'OK', { duration: 2500 });
      },
      error: (err) => {
        console.error('Failed to bulk delete notifications:', err);
        this.snackBar.open('Failed to delete notifications.', 'OK', { duration: 3000 });
      },
      complete: () => this.deleting.set(false),
    });
  }

  onNotificationClick(n: Notification): void {
    if (!n?._id) return;

    if (n.status === 'unread') {
      // Optimistic UI update
      this.items.update((current) => current.map((x) => (x._id === n._id ? { ...x, status: 'read' } : x)));

      this.notificationService.markAsRead(n._id).subscribe({
        error: () => {
          // Rollback on failure
          this.items.update((current) => current.map((x) => (x._id === n._id ? { ...x, status: 'unread' } : x)));
        },
      });
    }

    const actionUrl = (n as any)?.data?.actionUrl;
    if (typeof actionUrl === 'string' && actionUrl.trim()) {
      const url = actionUrl.trim();
      if (/^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener');
        return;
      }

      // Prefer absolute in-app paths. If older notifications store non-dashboard routes, we try a safe prefix.
      if (url.startsWith('/dashboard/')) {
        this.router.navigateByUrl(url);
      } else if (url.startsWith('/')) {
        //this.router.navigateByUrl(`/dashboard${url}`);
      }
    }
  }

  categoryFor(type: string): string {
    const t = String(type || '').toLowerCase();
    if (t.startsWith('promotion_') || t.includes('submission') || t.includes('deadline')) return 'promotions';
    if (t.startsWith('campaign_')) return 'campaign';
    if (t.includes('payment') || t.includes('payout') || t.includes('refund') || t.includes('low_balance')) return 'payments';
    if (t.includes('review') || t.includes('collaboration')) return 'forum';
    if (t.includes('badge') || t.includes('level') || t.includes('gamification')) return 'gamification';
    if (t.includes('system')) return 'system';
    return 'other';
  }

  priorityTone(n: Notification): PriorityTone {
    const p = String((n as any)?.priority || 'medium').toLowerCase();
    const t = String(n?.type || '').toLowerCase();

    // Type-based hard overrides
    if (t.includes('security')) return 'critical';
    if (t.includes('review_flagged')) return 'critical';

    if (p === 'low') return 'info';
    if (p === 'high') return 'warning';
    return 'success';
  }

  iconFor(n: Notification): string {
    const cat = this.categoryFor(n.type);
    switch (cat) {
      case 'campaign':
        return 'campaign';
      case 'promotions':
        return 'ads_click';
      case 'payments':
        return 'payments';
      case 'forum':
        return 'forum';
      case 'gamification':
        return 'military_tech';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  }

  groupByDay(list: Notification[]): NotificationGroup[] {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const groups: Record<NotificationGroup['label'], Notification[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    for (const n of list) {
      const created = new Date(n.createdAt).getTime();
      if (!Number.isFinite(created)) {
        groups.Earlier.push(n);
        continue;
      }

      if (created >= startOfToday) groups.Today.push(n);
      else if (created >= startOfYesterday) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    }

    const result: NotificationGroup[] = [];
    (['Today', 'Yesterday', 'Earlier'] as const).forEach((label) => {
      if (groups[label].length > 0) {
        result.push({ label, items: groups[label] });
      }
    });

    return result;
  }

  categoryLabel(key: string): string {
    const match = this.categoryOptions.find((o) => o.key === (key as any));
    return match?.label || 'Other';
  }
}
