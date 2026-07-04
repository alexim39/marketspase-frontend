import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from '../../../services/store.service';

@Component({
  selector: 'app-gallery-upload-dialog',
  standalone: true,
  providers: [StoreService],
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <div class="gallery-dialog">
      <div class="dialog-header">
        <h2><mat-icon>collections</mat-icon> Upload Gallery Media</h2>
        <button mat-icon-button class="close-btn" (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      @if (!selectedFiles().length) {
        <div class="drop-zone" (click)="openPicker()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
          <mat-icon>cloud_upload</mat-icon>
          <h3>Select media to upload</h3>
          <p>Images (JPG, PNG, WebP) & Videos (MP4, MOV)</p>
          <small>Max 5 files, 20MB each</small>
          <input type="file" #fileInput hidden accept="image/*,video/*" multiple (change)="onFilesSelected($event)" />
        </div>
      } @else {
        <div class="file-list">
          @for (file of selectedFiles(); track file.name) {
            <div class="file-row">
              <mat-icon>{{ file.type.startsWith('video/') ? 'videocam' : 'image' }}</mat-icon>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatSize(file.size) }}</span>
              </div>
              <button mat-icon-button class="remove-btn" (click)="removeFile($index)" [disabled]="uploading()"><mat-icon>close</mat-icon></button>
            </div>
          }
          <div class="selected-actions">
            <button mat-stroked-button (click)="clearFiles()" [disabled]="uploading()">Clear</button>
            <button mat-flat-button color="primary" (click)="upload()" [disabled]="uploading()">
              @if (uploading()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                <mat-icon>cloud_upload</mat-icon>
              }
              {{ uploading() ? 'Uploading...' : 'Upload ' + selectedFiles().length + ' file' + (selectedFiles().length > 1 ? 's' : '') }}
            </button>
          </div>
        </div>
      }

      @if (uploading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <div class="dialog-footer">
        <span class="footer-hint">Media will appear in your storefront gallery</span>
      </div>
    </div>
  `,
  styles: [`
    .gallery-dialog { padding: 0; min-width: 380px; max-width: 520px; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; h2 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 700; margin: 0; mat-icon { color: var(--primary-color); } } }
    .close-btn { color: var(--text-secondary); }
    .drop-zone { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 20px 24px; padding: 40px 20px; border: 2px dashed var(--border-color); border-radius: 12px; cursor: pointer; transition: border-color 0.2s, background 0.2s; &:hover { border-color: var(--primary-color); background: rgba(var(--primary-rgb), 0.03); } mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: var(--text-tertiary); } h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; } p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; } small { font-size: 0.72rem; color: var(--text-tertiary); } }
    .file-list { display: flex; flex-direction: column; gap: 8px; margin: 20px 24px; }
    .file-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(var(--primary-rgb), 0.03); border-radius: 8px; border: 1px solid var(--border-color); mat-icon { color: var(--primary-color); flex-shrink: 0; } .remove-btn { margin-left: auto; mat-icon { color: var(--text-secondary); font-size: 18px; width: 18px; height: 18px; } &:hover mat-icon { color: var(--error-color); } } }
    .file-info { flex: 1; min-width: 0; .file-name { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .file-size { display: block; font-size: 0.72rem; color: var(--text-tertiary); } }
    .selected-actions { display: flex; gap: 10px; margin-top: 8px; button { flex: 1; } }
    .dialog-footer { padding: 0 24px 20px; text-align: center; .footer-hint { font-size: 0.72rem; color: var(--text-tertiary); } }
  `]
})
export class GalleryUploadDialogComponent {
  private dialogRef = inject(MatDialogRef<GalleryUploadDialogComponent>);
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);

  storeId = signal<string>('');
  selectedFiles = signal<File[]>([]);
  uploading = signal(false);

  openPicker(): void {
    document.querySelector<HTMLInputElement>('.gallery-dialog input[type="file"]')?.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const current = this.selectedFiles();
      const newFiles = Array.from(input.files).slice(0, 5 - current.length);
      this.selectedFiles.set([...current, ...newFiles]);
    }
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      const current = this.selectedFiles();
      const newFiles = Array.from(event.dataTransfer.files).slice(0, 5 - current.length);
      this.selectedFiles.set([...current, ...newFiles]);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
  }

  upload(): void {
    const files = this.selectedFiles();
    if (!files.length || !this.storeId()) return;

    this.uploading.set(true);
    const formData = new FormData();
    files.forEach(f => formData.append('media', f, f.name));

    this.storeService.uploadGallery(this.storeId(), formData).subscribe({
      next: () => {
        this.uploading.set(false);
        this.snackBar.open('Media uploaded successfully!', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.uploading.set(false);
        this.snackBar.open(err?.error?.message || 'Upload failed', 'OK', { duration: 5000 });
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  close(): void {
    this.dialogRef.close();
  }
}
