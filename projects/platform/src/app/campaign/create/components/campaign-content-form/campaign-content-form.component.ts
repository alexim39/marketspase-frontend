import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, inject, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaFile } from '../../media-file.model';
import { CATEGORIES } from '../../../../common/utils/categories';

@Component({
  selector: 'app-campaign-content-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './campaign-content-form.component.html',
  styleUrls: ['./campaign-content-form.component.scss']
})
export class CampaignContentFormComponent implements OnInit {
  @Input({ required: true }) formGroup!: FormGroup;
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() mediaChange = new EventEmitter<MediaFile | null>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('mediaPreview') mediaPreview!: ElementRef<HTMLVideoElement | HTMLImageElement>;

  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  public isLoading = signal(false);
  public uploadProgress = signal(0);
  public selectedMedia = signal<MediaFile | null>(null);

  readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  readonly ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  readonly ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov'];

  ngOnInit(): void {
    this.formGroup.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const isValid = this.formGroup.valid && (!!this.selectedMedia() || this.formGroup.get('link')?.value);
        this.validityChange.emit(this.formGroup.valid);
      });
  }

  // File upload handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.snackBar.open(validation.message, 'OK', { duration: 5000 });
      return;
    }

    this.uploadProgress.set(0);
    const reader = new FileReader();

    reader.onloadstart = () => this.isLoading.set(true);
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        this.uploadProgress.set((event.loaded / event.total) * 100);
      }
    };

    reader.onload = (event) => {
      const url = event.target?.result as string;
      const mediaFile: MediaFile = {
        file,
        url,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        size: file.size
      };

      if (mediaFile.type === 'video') {
        this.getVideoDuration(url).then(duration => {
          mediaFile.duration = duration;
          this.selectedMedia.set(mediaFile);
          this.mediaChange.emit(mediaFile);
          this.isLoading.set(false);
          this.uploadProgress.set(100);
        });
      } else {
        this.selectedMedia.set(mediaFile);
        this.mediaChange.emit(mediaFile);
        this.isLoading.set(false);
        this.uploadProgress.set(100);
      }
    };

    reader.onerror = () => {
      this.snackBar.open('Error reading file. Please try again.', 'OK', { duration: 3000 });
      this.isLoading.set(false);
    };

    reader.readAsDataURL(file);
  }

  private validateFile(file: File): { isValid: boolean; message: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return { isValid: false, message: `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }
    const isImage = this.ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = this.ACCEPTED_VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      return { isValid: false, message: 'Please upload a valid image (JPEG, PNG, WebP) or video (MP4, WebM, MOV) file' };
    }
    return { isValid: true, message: '' };
  }

  private getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = url;
    });
  }

  removeMedia(): void {
    this.selectedMedia.set(null);
    this.mediaChange.emit(null);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.formGroup.get('media')?.setValue(null);
  }

  /* get categories() {
    return [
      { value: 'fashion', label: 'Fashion & Beauty' },
      { value: 'food', label: 'Food & Restaurants' },
      { value: 'tech', label: 'Technology' },
      { value: 'health', label: 'Health & Fitness' },
      { value: 'travel', label: 'Travel & Tourism' },
      { value: 'education', label: 'Education' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'business', label: 'Business & Finance' },
      { value: 'other', label: 'Other' }
    ];
  } */

  get categories() {
    return CATEGORIES;
  }

}