import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ThreadListComponent } from '../thread/thread-list/thread-list.component';
import { CreateThreadComponent } from '../create-thread/create-thread.component';
import { ForumPageComponent } from '../forum-page.component';
import { ForumService, Thread } from '../forum.service';

type ForumMobileSheet = 'filters' | 'insights' | null;

@Component({
  selector: 'app-forum-mobile',
  standalone: true,
  providers: [ForumService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ThreadListComponent,
  ],
  templateUrl: './forum-mobile.component.html',
  styleUrls: ['./forum-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForumMobileComponent extends ForumPageComponent {
  private readonly mobileDialog = inject(MatDialog);

  protected readonly activeSheet = signal<ForumMobileSheet>(null);

  protected readonly sortOptions = [
    { value: 'newest', label: 'Latest', icon: 'fiber_new' },
    { value: 'most_liked', label: 'Most liked', icon: 'thumb_up' },
    { value: 'most_commented', label: 'Most active', icon: 'forum' },
    { value: 'trending', label: 'Trending', icon: 'local_fire_department' },
  ];

  constructor() {
    const forumService = inject(ForumService);
    const dialog = inject(MatDialog);
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const cd = inject(ChangeDetectorRef);
    super(forumService, dialog, route, router, cd);
  }

  protected get heroThreads(): Thread[] {
    return this.pinnedThreads.length ? this.pinnedThreads.slice(0, 2) : this.trendingThreads.slice(0, 2);
  }

  protected get activeSortLabel(): string {
    return this.sortOptions.find((option) => option.value === this.sortBy)?.label || 'Latest';
  }

  protected get visibleTopics(): string[] {
    return this.popularTags.slice(0, 12);
  }

  protected openSheet(sheet: ForumMobileSheet): void {
    this.activeSheet.set(sheet);
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
  }

  protected selectSort(value: string): void {
    this.applySort(value);
    this.closeSheet();
  }

  protected selectTopic(tag: string | null): void {
    this.filterByTag(tag);
    this.closeSheet();
  }

  protected retryLoad(): void {
    this.loadAllData();
  }

  override openCreateThreadDialog(): void {
    const dialogRef = this.mobileDialog.open(CreateThreadComponent, {
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      maxHeight: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: ['marketspase-dialog', 'forum-compose-mobile-dialog'],
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.pagination.page = 1;
        this.loadAllData();
      }
    });
  }
}
