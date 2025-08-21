import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { UserInterface } from '../../common/services/user.service';
import { ApiService } from '../../common/services/api.service';

@Component({
  selector: 'async-profile-image-uploader',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="profile-card">
      <mat-card-content>
        <form [formGroup]="profileForm" class="profile-form">
          <!-- Profile Picture Section with Drag & Drop -->
          <div class="profile-picture-section" 
               (drop)="onFileDrop($event)"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               [class.drag-over]="isDragOver">
            
            <div class="drag-drop-zone">
              <!-- Display uploaded image or placeholder -->
              <div class="image-preview" *ngIf="imagePreview">
                <img [src]="imagePreview" alt="Profile Preview">
                <button mat-icon-button class="remove-btn" (click)="removeImage()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              
              <div class="upload-content" *ngIf="!imagePreview">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p>Drag & drop your profile picture here</p>
                <small>or</small>
                <button mat-stroked-button color="primary" (click)="fileInput.click()">
                  Browse Files
                </button>
                <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)">
              </div>
              
              <div class="picture-instructions">
                <small>JPEG or PNG, max 5MB</small>
              </div>
            </div>
          </div>
        </form>
      </mat-card-content>

      <mat-progress-bar 
          *ngIf="uploadProgress > 0"
          mode="determinate" 
          [value]="uploadProgress">
      </mat-progress-bar>
    </mat-card>
  `,
  styles: [`
    .profile-card {
      margin-bottom: 2em;
    }

    .profile-picture-section {
      position: relative;
      margin-bottom: 2rem;
    }

    .drag-drop-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      position: relative;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .drag-over .drag-drop-zone {
      border-color: #3f51b5;
      background-color: rgba(63, 81, 181, 0.05);
    }

    .image-preview {
      position: relative;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 1rem;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .remove-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(255, 255, 255, 0.8);
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .upload-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        margin-bottom: 1rem;
        color: #757575;
      }
      
      button {
        margin-top: 1rem;
      }
    }

    .picture-instructions {
      margin-top: 1rem;
      color: #757575;
      
      small {
        display: block;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class ProfileImageUploaderComponent {
  @Input() user!: UserInterface;
  //apiURL = 'http://localhost:8080';

  profileForm: FormGroup;
  isDragOver = false;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  uploadProgress = 0;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService
  ) {
    this.profileForm = this.fb.group({});
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFileSelection(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    if (!this.validateFile(file)) return;

    this.selectedFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    // Upload immediately
    this.uploadImage();
  }

  private validateFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Only JPEG, PNG images are allowed', 'Close', { duration: 5000 });
      return false;
    }
    
    if (file.size > maxSize) {
      this.snackBar.open('Image size must be less than 5MB', 'Close', { duration: 5000 });
      return false;
    }
    
    return true;
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.uploadProgress = 0;
    
    const formData = new FormData();
    formData.append('profilePicture', this.selectedFile);  // Fixed field name
    formData.append('userId', this.user?._id || '');
    
    this.http.post(this.apiService.getBaseUrl() + `/image/profile/${this.user._id}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
          this.cdr.detectChanges();
        } else if (event.type === HttpEventType.Response) {
          const response = event.body;
          if (response.success) {
            this.snackBar.open('Profile image uploaded successfully!', 'Close', { duration: 5000 });
            // Update user image preview with the URL from the response
            if (response.profileImage) {
              this.imagePreview = response.profileImage;
            }
          } else {
            console.error('Upload failed:', response);
            this.snackBar.open(response.message || 'Upload failed', 'Close', { duration: 5000 });
          }
        }
      },
      error: (error) => {
        this.snackBar.open('Error uploading image: ' + error.message, 'Close', { duration: 5000 });
        this.isLoading = false;
        this.uploadProgress = 0;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
}

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadProgress = 0;
  }
}