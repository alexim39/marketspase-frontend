import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { Store } from '../../shared/store.model';
import { User } from '../../shared/user.model';

interface StoreEditDialogData {
  store: Store;
  users: User[];
}

@Component({
  selector: 'app-store-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  template: `
    <div class="store-edit-dialog">
      <h2 mat-dialog-title>Edit Store</h2>
      
      <form [formGroup]="storeForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-content">
            <!-- Basic Information Section -->
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Store Name</mat-label>
                  <input matInput formControlName="name" placeholder="Enter store name">
                  @if (storeForm.get('name')?.hasError('required')) {
                    <mat-error>Store name is required</mat-error>
                  }
                </mat-form-field>
              </div>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" 
                          placeholder="Enter store description"
                          rows="3"></textarea>
                </mat-form-field>
              </div>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Category</mat-label>
                  <input matInput formControlName="category" placeholder="e.g., Fashion, Electronics">
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Store Link</mat-label>
                  <input matInput formControlName="storeLink" placeholder="store-slug">
                  <span matPrefix>/store/</span>
                  @if (storeForm.get('storeLink')?.hasError('required')) {
                    <mat-error>Store link is required</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <!-- Store Owner Section -->
            <div class="form-section">
              <h3 class="section-title">Store Owner</h3>
              
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Owner</mat-label>
                <mat-select formControlName="owner">
                  <mat-option>-- Select Owner --</mat-option>
                  @for (user of data.users; track user._id) {
                    <mat-option [value]="user._id">
                      {{ user.name || user.email }} ({{ user.role }})
                    </mat-option>
                  }
                </mat-select>
                @if (storeForm.get('owner')?.hasError('required')) {
                  <mat-error>Owner is required</mat-error>
                }
              </mat-form-field>
            </div>
            
            <mat-divider></mat-divider>
            
            <!-- Store Settings Section -->
            <div class="form-section">
              <h3 class="section-title">Store Settings</h3>
              
              <div class="settings-grid">
                <div class="setting-item">
                  <mat-slide-toggle formControlName="isVerified">
                    Verified Store
                  </mat-slide-toggle>
                  <p class="setting-description">Mark store as verified for additional credibility</p>
                </div>
                
                <div class="setting-item">
                  <mat-slide-toggle formControlName="isActive">
                    Active Store
                  </mat-slide-toggle>
                  <p class="setting-description">Enable or disable store visibility</p>
                </div>
                
                <div class="setting-item">
                  <mat-slide-toggle formControlName="isDefaultStore">
                    Default Store
                  </mat-slide-toggle>
                  <p class="setting-description">Set as user's default store</p>
                </div>
                
                <div class="setting-item">
                  <mat-slide-toggle formControlName="isPremium">
                    Premium Tier
                  </mat-slide-toggle>
                  <p class="setting-description">Enable premium features and analytics</p>
                </div>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <!-- WhatsApp Integration Section -->
            <div class="form-section">
              <h3 class="section-title">WhatsApp Integration</h3>
              
              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>WhatsApp Number</mat-label>
                <input matInput formControlName="whatsappNumber" placeholder="+1234567890">
                <mat-icon matSuffix>whatsapp</mat-icon>
              </mat-form-field>
            </div>
          </div>
        </mat-dialog-content>
        
        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button 
                  color="primary" 
                  type="submit"
                  [disabled]="!storeForm.valid || storeForm.pristine">
            <mat-icon>save</mat-icon>
            Save Changes
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .store-edit-dialog {
      width: 600px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    
    h2.mat-dialog-title {
      margin: 0;
      padding: 24px 24px 16px;
      font-size: 24px;
      font-weight: 500;
      color: #202124;
    }
    
    mat-dialog-content {
      padding: 0 24px;
      margin: 0;
      flex: 1;
      overflow-y: auto;
    }
    
    .form-content {
      padding: 8px 0;
    }
    
    .form-section {
      margin-bottom: 24px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: #202124;
      margin: 0 0 16px 0;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
      }
    }
    
    .form-field {
      flex: 1;
    }
    
    .full-width {
      flex: 1 1 100%;
    }
    
    textarea.mat-input-element {
      resize: vertical;
      min-height: 80px;
    }
    
    mat-divider {
      margin: 24px 0;
    }
    
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .setting-description {
      margin: 0;
      font-size: 12px;
      color: #5f6368;
      line-height: 1.4;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
      border-top: 1px solid #e0e0e0;
      
      button {
        min-width: 100px;
        
        mat-icon {
          margin-right: 8px;
        }
      }
    }
    
    ::ng-deep {
      .mat-mdc-form-field {
        width: 100%;
      }
      
      .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }
  `]
})
export class StoreEditDialogComponent implements OnInit {
  storeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StoreEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreEditDialogData
  ) {
    this.storeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      category: [''],
      storeLink: ['', [Validators.required, Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
      owner: ['', [Validators.required]],
      isVerified: [false],
      isActive: [true],
      isDefaultStore: [false],
      isPremium: [false],
      whatsappNumber: ['']
    });
  }

  ngOnInit(): void {
    this.patchFormValues();
  }

  patchFormValues(): void {
    const store = this.data.store;
    this.storeForm.patchValue({
      name: store.name || '',
      description: store.description || '',
      category: store.category || '',
      storeLink: store.storeLink || '',
      owner: store.owner?._id || '',
      isVerified: store.isVerified || false,
      isActive: store.isActive !== false,
      isDefaultStore: store.isDefaultStore || false,
      isPremium: store.verificationTier === 'premium',
      whatsappNumber: store.whatsappNumber || ''
    });
  }

  onSubmit(): void {
    if (this.storeForm.valid) {
      const formValue = this.storeForm.value;
      
      const updatedStore = {
        ...this.data.store,
        name: formValue.name,
        description: formValue.description,
        category: formValue.category,
        storeLink: formValue.storeLink,
        owner: formValue.owner,
        isVerified: formValue.isVerified,
        isActive: formValue.isActive,
        isDefaultStore: formValue.isDefaultStore,
        verificationTier: formValue.isPremium ? 'premium' : 'basic',
        whatsappNumber: formValue.whatsappNumber
      };
      
      this.dialogRef.close(updatedStore);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}