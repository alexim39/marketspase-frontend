import { Component, OnInit, OnDestroy } from '@angular/core';
import { ForumService, Thread } from './forum.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThreadListComponent } from './thread/thread-list.component';
import { CreateThreadComponent } from './create-thread/create-thread.component';
import { MatButtonModule } from '@angular/material/button';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-forum-page',
  standalone: true,
  providers: [ForumService],
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ThreadListComponent,
  ],
  template: `
    <div class="forum-container">
      <mat-toolbar color="primary" class="forum-header">
        <button mat-icon-button *ngIf="currentView === 'detail'" (click)="backToList()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="title">Community Forum</span>
        <span class="spacer"></span>
        <button mat-raised-button color="accent" (click)="openCreateThreadDialog()">
          <mat-icon>add</mat-icon>
          New Thread
        </button>
      </mat-toolbar>

      <div class="forum-content">
        <div *ngIf="currentView === 'list'">
          <div class="popular-tags">
            <h3>Popular Tags</h3>
            <div class="tags-container">
              <mat-chip *ngFor="let tag of popularTags" (click)="filterByTag(tag)">
                {{tag}}
              </mat-chip>
            </div>
          </div>

          @if (isLoading) {
            <div class="loading-spinner">
              <mat-spinner diameter="40"/>
              <span>Loading threads...</span>
            </div>
          } @else {
            <app-thread-list 
            [threads]="threads"
            (threadClicked)="navigateToThread($event)"
            />
          }
          @if (!isLoading && threads.length === 0) {
            <div class="no-threads">
              <mat-icon>forum</mat-icon>
              <p>No discussions found</p>
              <button mat-raised-button color="primary" (click)="openCreateThreadDialog()">
                Start a discussion
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./forum-page.component.scss']
})
export class ForumPageComponent implements OnInit, OnDestroy {
  threads: Thread[] = [];
  selectedThread: Thread | null = null;
  isLoading = false;
  currentView: 'list' | 'detail' = 'list';
  popularTags = ['marketers', 'promoters', 'discussion', 'announcements', 'questions', 'how-to'];
  private destroy$ = new Subject<void>();

  constructor(
    private forumService: ForumService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['threadId']) {
        this.loadThread(params['threadId']);
      } else {
        this.loadThreads();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadThreads(): void {
    this.currentView = 'list';
    this.isLoading = true;
    this.selectedThread = null;

    this.forumService.getThreads().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges(); 
      })
    ).subscribe({
      next: (response) => {
        //console.log('response ',response);
        this.threads = response?.data || [];
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Error loading threads:', err);
        this.threads = [];
        this.cd.detectChanges(); 
      }
    });
  }

  loadThread(threadId: string): void {
    //this.currentView = 'detail';
    this.isLoading = true;

    this.forumService.getThreadById(threadId).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (thread) => {
        this.selectedThread = thread;
      },
      error: (err) => {
        console.error('Error loading thread:', err);
        this.selectedThread = null;
      }
    });
  }

  navigateToThread(threadId: any): void {
    //console.log('Navigating to thread ID:', threadId);
    if (threadId) {  // Remove the !
      this.router.navigate(['/dashboard/forum/thread', threadId]);  
    }
  }

  backToList(): void {
    this.router.navigate(['/forum']);
  }

  openCreateThreadDialog(): void {
    const dialogRef = this.dialog.open(CreateThreadComponent, {
      width: '600px',
      maxWidth: '100vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadThreads();
      }
    });
  }

  filterByTag(tag: string): void {
    this.isLoading = true;
    this.forumService.getThreadsByTag(tag).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges(); 
      })
    ).subscribe({
      next: (response) => {
        //console.log('response by tag ',response)
        this.threads = response?.data || [];
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Error filtering threads:', err);
        this.threads = [];
        this.cd.detectChanges(); 
      }
    });
  }
}