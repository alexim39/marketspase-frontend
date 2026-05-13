import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { map, Observable, startWith } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ForumService } from '../forum.service';
import { UserService } from '../../../common/services/user.service';

interface MediaPreview {
  url: string;
  type: 'image' | 'video' | 'audio';
  mimeType: string;
  fileName: string;
}

@Component({
  selector: 'app-create-thread',
  standalone: true,
  providers: [ForumService],
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
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-thread.component.html',
  styleUrls: ['./create-thread.component.scss'],
})
export class CreateThreadComponent {
  threadForm: FormGroup;
  tags: string[] = [];
  topicTags: string[] = [];
  categoryOptions = [
    'discussion',
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
  ];
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
    'discussion',
    'facebook-ads',
    'instagram-growth',
    'whatsapp-sales',
    'creator-tips',
  ];

  isSubmitting = false;
  showPollBuilder = false;
  pollOptions = ['', '', '', ''];

  mediaFiles: File[] = [];
  mediaPreviews: MediaPreview[] = [];

  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl('');
  topicCtrl = new FormControl('');
  filteredTags: Observable<string[]>;
  filteredTopics: Observable<string[]>;

  private snackBar = inject(MatSnackBar);
  private cdRef = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  public user = this.userService.user;

  @ViewChild('mediaInput') mediaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  @ViewChild('topicInput') topicInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private forumService: ForumService,
    private dialogRef: MatDialogRef<CreateThreadComponent>,
  ) {
    this.threadForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      category: ['discussion', [Validators.required]],
      pollQuestion: [''],
      allowMultiple: [false],
    });

    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterList(value || '', this.tags)),
    );

    this.filteredTopics = this.topicCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterList(value || '', this.topicTags)),
    );
  }

  private filterList(value: string, selected: string[]): string[] {
    const filterValue = value.toLowerCase();
    return this.availableTags.filter((tag) =>
      tag.toLowerCase().includes(filterValue) && !selected.includes(tag));
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []).slice(0, 6);

    if (!files.length) {
      return;
    }

    this.mediaFiles = files;
    this.mediaPreviews = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        this.snackBar.open(`${file.name} is not a supported file type`, 'Close', { duration: 3000 });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.mediaPreviews.push({
          url: reader.result as string,
          type: file.type.startsWith('video/')
            ? 'video'
            : file.type.startsWith('audio/')
              ? 'audio'
              : 'image',
          mimeType: file.type,
          fileName: file.name,
        });
        this.cdRef.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  removeMedia(index: number): void {
    this.mediaFiles.splice(index, 1);
    this.mediaPreviews.splice(index, 1);

    if (!this.mediaFiles.length && this.mediaInput?.nativeElement) {
      this.mediaInput.nativeElement.value = '';
    }

    this.cdRef.detectChanges();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim().toLowerCase();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    event.chipInput?.clear();
    this.tagCtrl.setValue('');
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter((entry) => entry !== tag);
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.tags.includes(value)) {
      this.tags.push(value);
    }
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue('');
  }

  addTopicTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim().toLowerCase();
    if (value && !this.topicTags.includes(value)) {
      this.topicTags.push(value);
    }
    event.chipInput?.clear();
    this.topicCtrl.setValue('');
  }

  removeTopicTag(tag: string): void {
    this.topicTags = this.topicTags.filter((entry) => entry !== tag);
  }

  selectedTopic(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.topicTags.includes(value)) {
      this.topicTags.push(value);
    }
    this.topicInput.nativeElement.value = '';
    this.topicCtrl.setValue('');
  }

  togglePollBuilder(): void {
    this.showPollBuilder = !this.showPollBuilder;
    if (!this.showPollBuilder) {
      this.threadForm.patchValue({
        pollQuestion: '',
        allowMultiple: false,
      });
      this.pollOptions = ['', '', '', ''];
    }
  }

  updatePollOption(index: number, value: string): void {
    this.pollOptions[index] = value;
  }

  private buildPollPayload(): Record<string, unknown> | null {
    if (!this.showPollBuilder) {
      return null;
    }

    const question = String(this.threadForm.value.pollQuestion || '').trim();
    const options = this.pollOptions
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, 4);

    if (!question || options.length < 2) {
      return null;
    }

    return {
      question,
      allowMultiple: Boolean(this.threadForm.value.allowMultiple),
      options: options.map((label, index) => ({
        optionId: `option-${index + 1}`,
        label,
      })),
    };
  }

  onSubmit(): void {
    if (this.threadForm.invalid) {
      return;
    }

    if (!this.user || !this.user()?._id) {
      this.snackBar.open('You need to sign in to post in the forum', 'Close', { duration: 3000 });
      return;
    }

    const poll = this.buildPollPayload();
    if (this.showPollBuilder && !poll) {
      this.snackBar.open('Add a poll question and at least two options', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('title', this.threadForm.value.title);
    formData.append('content', this.threadForm.value.content);
    formData.append('category', this.threadForm.value.category);
    formData.append('tags', JSON.stringify(this.tags));
    formData.append('topicTags', JSON.stringify(this.topicTags));
    formData.append('source', 'forum');

    if (poll) {
      formData.append('poll', JSON.stringify(poll));
    }

    this.mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    this.forumService.createThread(formData).subscribe({
      next: (thread) => {
        this.isSubmitting = false;
        this.snackBar.open('Discussion created successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(thread);
        this.cdRef.detectChanges();
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating thread:', error);
        this.snackBar.open(error?.error?.message || 'Failed to create discussion. Please try again.', 'Close', { duration: 3000 });
        this.cdRef.detectChanges();
      },
    });
  }
}
