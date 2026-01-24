import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ForumService } from '../forum.service';
import { MatInputModule } from '@angular/material/input';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { map, Observable, startWith, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../common/services/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-thread',
  providers: [ForumService],
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    FormsModule, 
    MatButtonModule, 
    MatDialogModule, 
    MatInputModule, 
    MatChipsModule, 
    CommonModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule 
  ],
  template: `
    <h2 mat-dialog-title>Create New Thread</h2>

    <mat-dialog-content>
      <form [formGroup]="threadForm">
        <!-- Existing form fields remain the same -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Thread Title</mat-label>
          <input matInput formControlName="title" required>
          <mat-error *ngIf="threadForm.get('title')?.hasError('required')">
            Title is required
          </mat-error>
          <mat-error *ngIf="threadForm.get('title')?.hasError('maxlength')">
            Title must be less than 200 characters
          </mat-error>
        </mat-form-field>
       
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Content</mat-label>
          <textarea matInput formControlName="content" rows="8" required></textarea>
          <mat-error *ngIf="threadForm.get('content')?.hasError('required')">
            Content is required
          </mat-error>
          <mat-error *ngIf="threadForm.get('content')?.hasError('maxlength')">
            Content must be less than 5000 characters
          </mat-error>
        </mat-form-field>
       
        <div class="media-section">
          <h4>Media Attachment (Optional)</h4>
          <div class="media-preview" *ngIf="mediaPreview">
            <img *ngIf="mediaType === 'image'" [src]="mediaPreview" alt="Preview" class="preview-image">
            <video *ngIf="mediaType === 'video'" controls class="preview-video">
              <source [src]="mediaPreview" [type]="mediaFileType">
            </video>
            <audio *ngIf="mediaType === 'audio'" controls class="preview-audio">
              <source [src]="mediaPreview" [type]="mediaFileType">
            </audio>
            <button mat-icon-button (click)="removeMedia()" class="remove-media-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <input type="file" #mediaInput (change)="onMediaSelected($event)" accept="image/*, video/*, audio/*" hidden>
          <button mat-stroked-button type="button" (click)="mediaInput.click()" class="media-upload-btn">
            <mat-icon>attach_file</mat-icon>
            {{ mediaPreview ? 'Change Media' : 'Attach Media' }}
          </button>
          <small class="hint">Supported formats: JPG, PNG, GIF, MP4, WEBM, MP3, WAV</small>
        </div>
       
        <div class="tags-section">
          <h4>Tags</h4>
          <mat-form-field appearance="outline">
            <mat-label>Add Tags</mat-label>
            <mat-chip-grid #chipGrid>
              <mat-chip-row *ngFor="let tag of tags" (removed)="removeTag(tag)">
                {{tag}}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
              <input 
                placeholder="New tag..."
                #tagInput
                [formControl]="tagCtrl"
                [matChipInputFor]="chipGrid"
                [matAutocomplete]="auto"
                [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                (matChipInputTokenEnd)="addTag($event)">
            </mat-chip-grid>
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
              <mat-option *ngFor="let tag of filteredTags | async" [value]="tag">
                {{tag}}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isSubmitting">Cancel</button>
      <button mat-raised-button
              color="primary"
              (click)="onSubmit()"
              [disabled]="threadForm.invalid || !user || isSubmitting">
        <div class="submit-button-content">
          <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
          <span *ngIf="!isSubmitting">Create Thread</span>
          <span *ngIf="isSubmitting">Creating...</span>
        </div>
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./create-thread.component.scss']
})
export class CreateThreadComponent {
  threadForm: FormGroup;
  tags: string[] = [];
  availableTags = [
    'announcements',
    'questions',
    'how-to',
    'promotions',
    'success-stories',
    'feedback',
    'marketers',
    'promoters',
    'conversion',
    'payouts',
    'bugs',
    'discussion'
  ];


  isSubmitting = false;
  
  // Media properties
  mediaFile: File | null = null;
  mediaPreview: string | null = null;
  mediaType: 'image' | 'video' | 'audio' | null = null;
  mediaFileType: string | null = null;
  
  // Autocomplete properties
  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl();
  filteredTags: Observable<string[]>;

  private snackBar = inject(MatSnackBar);
  private cdRef = inject(ChangeDetectorRef);
  subscriptions: Subscription[] = [];

  @ViewChild('mediaInput') mediaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  private userService = inject(UserService);
  public user = this.userService.user;

  constructor(
    private fb: FormBuilder,
    private forumService: ForumService,
    private dialogRef: MatDialogRef<CreateThreadComponent>
  ) {
    this.threadForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]]
    });

    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => 
        tag ? this._filter(tag) : this.availableTags.slice()));
  }

  // ngOnInit(): void {
  //   this.subscriptions.push(
  //     this.userService.getCurrentUser$.subscribe({
  //       next: (user) => {
  //         this.user = user;
  //         this.cdRef.detectChanges(); 
  //       }
  //     })
  //   )
  // }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.mediaFile = input.files[0];
      
      // Check file type
      if (this.mediaFile.type.startsWith('image/')) {
        this.mediaType = 'image';
      } else if (this.mediaFile.type.startsWith('video/')) {
        this.mediaType = 'video';
      } else if (this.mediaFile.type.startsWith('audio/')) {
        this.mediaType = 'audio';
      } else {
        this.snackBar.open('Unsupported file type', 'Close', { duration: 3000 });
        return;
      }
      
      this.mediaFileType = this.mediaFile.type;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.mediaPreview = reader.result as string;
        this.cdRef.detectChanges(); 
      };
      reader.readAsDataURL(this.mediaFile);
    }
  }

  removeMedia(): void {
    this.mediaFile = null;
    this.mediaPreview = null;
    this.mediaType = null;
    this.mediaFileType = null;
    this.mediaInput.nativeElement.value = '';
    this.cdRef.detectChanges(); 
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    
    // Add our tag
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.cdRef.detectChanges(); 
    }

    // Clear the input value
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
      this.cdRef.detectChanges(); 
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (!this.tags.includes(event.option.viewValue)) {
      this.tags.push(event.option.viewValue);
      this.cdRef.detectChanges(); 
    }
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.availableTags.filter(tag => 
      tag.toLowerCase().includes(filterValue) && !this.tags.includes(tag));
  }

 onSubmit() {
    if (this.threadForm.invalid) return;
    if (!this.user || !this.user()?._id) {
      this.snackBar.open('You need to sign in to make forum post', 'Close', { duration: 3000 });
    } else {
      this.isSubmitting = true;
      const formData = new FormData();
      formData.append('title', this.threadForm.value.title);
      formData.append('content', this.threadForm.value.content);
      formData.append('tags', JSON.stringify(this.tags));
      formData.append('authorId', this.user()?._id as string);
      
      if (this.mediaFile) {
        formData.append('media', this.mediaFile);
        formData.append('mediaType', this.mediaType!);
      }
      
      this.forumService.createThread(formData).subscribe({
        next: (thread) => {
          this.isSubmitting = false;
          this.snackBar.open('Thread created successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(thread);
          this.cdRef.detectChanges();
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error creating thread:', error);
          this.snackBar.open('Failed to create thread. Please try again.', 'Close', { duration: 3000 });
          this.cdRef.detectChanges();
        }
      });
    }
  }

  ngOnDestroy() {
    // unsubscribe list
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  } 
}