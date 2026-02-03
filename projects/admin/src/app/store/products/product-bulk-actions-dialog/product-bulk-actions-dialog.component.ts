import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

interface ProductBulkActionsDialogData {
  selectedCount: number;
  storeId: string;
}

interface BulkAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-product-bulk-actions-dialog',
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
    MatRadioModule,
    MatDividerModule,
    MatExpansionModule
  ],
  template: `
    <div class="bulk-actions-dialog">
      <h2 mat-dialog-title>Bulk Actions ({{ data.selectedCount }} products)</h2>
      
      <form [formGroup]="bulkForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="action-selection">
            <mat-radio-group formControlName="action" class="action-radio-group">
              @for (action of availableActions; track action.id) {
                <mat-radio-button [value]="action.id" class="action-option">
                  <div class="action-content">
                    <mat-icon [color]="action.color" class="action-icon">{{ action.icon }}</mat-icon>
                    <div class="action-info">
                      <span class="action-label">{{ action.label }}</span>
                      <span class="action-description">{{ action.description }}</span>
                    </div>
                  </div>
                </mat-radio-button>
              }
            </mat-radio-group>
          </div>
          
          <!-- Action-specific configurations -->
          <div class="action-configuration">
            @switch (selectedAction) {
              @case ('activate') {
                <div class="config-section">
                  <p class="config-description">
                    Set selected products as active. They will be visible to customers.
                  </p>
                </div>
              }
              
              @case ('deactivate') {
                <div class="config-section">
                  <p class="config-description">
                    Set selected products as draft. They will not be visible to customers.
                  </p>
                </div>
              }
              
              @case ('delete') {
                <div class="config-section warning">
                  <div class="warning-header">
                    <mat-icon color="warn">warning</mat-icon>
                    <span class="warning-title">Delete Products</span>
                  </div>
                  <p class="config-description">
                    This action cannot be undone. All selected products will be permanently deleted.
                  </p>
                </div>
              }
              
              @case ('update-category') {
                <div class="config-section">
                  <mat-form-field appearance="outline" class="form-field full-width">
                    <mat-label>New Category</mat-label>
                    <input matInput formControlName="category" placeholder="Enter new category">
                    @if (bulkForm.get('category')?.hasError('required')) {
                      <mat-error>Category is required</mat-error>
                    }
                  </mat-form-field>
                </div>
              }
              
              @case ('update-price') {
                <div class="config-section">
                  <div class="price-update-options">
                    <mat-radio-group formControlName="priceUpdateType" class="price-type-group">
                      <mat-radio-button value="fixed">Fixed Amount</mat-radio-button>
                      <mat-radio-button value="percentage">Percentage</mat-radio-button>
                    </mat-radio-group>
                    
                    <div class="price-inputs">
                      @if (bulkForm.get('priceUpdateType')?.value === 'fixed') {
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Amount</mat-label>
                          <input matInput type="number" step="0.01" formControlName="priceFixedAmount" placeholder="0.00">
                          <span matPrefix>$</span>
                          @if (bulkForm.get('priceFixedAmount')?.hasError('required')) {
                            <mat-error>Amount is required</mat-error>
                          }
                        </mat-form-field>
                        
                        <mat-radio-group formControlName="priceFixedOperation" class="price-operation-group">
                          <mat-radio-button value="increase">Increase by</mat-radio-button>
                          <mat-radio-button value="decrease">Decrease by</mat-radio-button>
                          <mat-radio-button value="set">Set to</mat-radio-button>
                        </mat-radio-group>
                      } @else {
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Percentage</mat-label>
                          <input matInput type="number" step="0.01" formControlName="pricePercentage" placeholder="0">
                          <span matSuffix>%</span>
                          @if (bulkForm.get('pricePercentage')?.hasError('required')) {
                            <mat-error>Percentage is required</mat-error>
                          }
                          @if (bulkForm.get('pricePercentage')?.hasError('min')) {
                            <mat-error>Minimum 0%</mat-error>
                          }
                          @if (bulkForm.get('pricePercentage')?.hasError('max')) {
                            <mat-error>Maximum 1000%</mat-error>
                          }
                        </mat-form-field>
                        
                        <mat-radio-group formControlName="pricePercentageOperation" class="price-operation-group">
                          <mat-radio-button value="increase">Increase by</mat-radio-button>
                          <mat-radio-button value="decrease">Decrease by</mat-radio-button>
                        </mat-radio-group>
                      }
                    </div>
                  </div>
                </div>
              }
            }
          </div>
          
          <!-- Summary -->
          <div class="action-summary">
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>info</mat-icon>
                  <span>Action Summary</span>
                </mat-panel-title>
              </mat-expansion-panel-header>
              
              <div class="summary-content">
                <div class="summary-item">
                  <span class="summary-label">Selected Products:</span>
                  <span class="summary-value">{{ data.selectedCount }}</span>
                </div>
                
                <div class="summary-item">
                  <span class="summary-label">Action:</span>
                  <span class="summary-value">{{ getActionLabel() }}</span>
                </div>
                
                @if (selectedAction === 'update-category' && bulkForm.get('category')?.value) {
                  <div class="summary-item">
                    <span class="summary-label">New Category:</span>
                    <span class="summary-value">{{ bulkForm.get('category')?.value }}</span>
                  </div>
                }
                
                @if (selectedAction === 'update-price') {
                  <div class="summary-item">
                    <span class="summary-label">Price Update:</span>
                    <span class="summary-value">{{ getPriceUpdateSummary() }}</span>
                  </div>
                }
              </div>
            </mat-expansion-panel>
          </div>
        </mat-dialog-content>
        
        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button 
                  [color]="getActionButtonColor()" 
                  type="submit"
                  [disabled]="!bulkForm.valid">
            <mat-icon>{{ getActionIcon() }}</mat-icon>
            {{ getActionButtonText() }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .bulk-actions-dialog {
      width: 500px;
      max-width: 90vw;
    }
    
    h2.mat-dialog-title {
      margin: 0;
      padding: 24px 24px 16px;
      font-size: 20px;
      font-weight: 500;
      color: #202124;
    }
    
    mat-dialog-content {
      padding: 0 24px;
      margin: 0;
      max-height: 60vh;
      overflow-y: auto;
    }
    
    .action-selection {
      margin-bottom: 24px;
    }
    
    .action-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .action-option {
      ::ng-deep .mat-radio-label-content {
        width: 100%;
        padding-left: 8px;
      }
    }
    
    .action-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f8f9fa;
        border-color: #1a73e8;
      }
    }
    
    .action-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .action-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .action-label {
      font-weight: 500;
      font-size: 14px;
      color: #202124;
    }
    
    .action-description {
      font-size: 12px;
      color: #5f6368;
      line-height: 1.4;
    }
    
    .action-configuration {
      margin-bottom: 24px;
    }
    
    .config-section {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      
      &.warning {
        background: #fef7e0;
        border: 1px solid #f9ab00;
      }
    }
    
    .warning-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .warning-title {
      font-weight: 600;
      color: #f9ab00;
    }
    
    .config-description {
      margin: 0;
      font-size: 14px;
      color: #5f6368;
      line-height: 1.5;
    }
    
    .form-field {
      width: 100%;
    }
    
    .full-width {
      width: 100%;
    }
    
    .price-update-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .price-type-group, .price-operation-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .price-inputs {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .action-summary {
      margin-top: 24px;
    }
    
    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .summary-label {
      font-size: 14px;
      color: #5f6368;
    }
    
    .summary-value {
      font-size: 14px;
      font-weight: 500;
      color: #202124;
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
      .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }
  `]
})
export class ProductBulkActionsDialogComponent {
  bulkForm: FormGroup;
  selectedAction: string = '';
  
  availableActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Activate Products',
      description: 'Set selected products as active (visible to customers)',
      icon: 'check_circle',
      color: 'primary'
    },
    {
      id: 'deactivate',
      label: 'Deactivate Products',
      description: 'Set selected products as draft (not visible to customers)',
      icon: 'pause_circle',
      color: 'accent'
    },
    {
      id: 'delete',
      label: 'Delete Products',
      description: 'Permanently remove selected products',
      icon: 'delete',
      color: 'warn'
    },
    {
      id: 'update-category',
      label: 'Update Category',
      description: 'Change category for all selected products',
      icon: 'category',
      color: 'primary'
    },
    {
      id: 'update-price',
      label: 'Update Prices',
      description: 'Bulk update prices for selected products',
      icon: 'attach_money',
      color: 'primary'
    }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductBulkActionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductBulkActionsDialogData
  ) {
    this.bulkForm = this.fb.group({
      action: ['', [Validators.required]],
      category: [''],
      priceUpdateType: ['fixed'],
      priceFixedAmount: [0, [Validators.required, Validators.min(0)]],
      priceFixedOperation: ['increase'],
      pricePercentage: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
      pricePercentageOperation: ['increase']
    });
    
    // Watch for action changes
    this.bulkForm.get('action')?.valueChanges.subscribe(action => {
      this.selectedAction = action;
      this.updateValidators();
    });
    
    // Initialize with first action
    this.selectedAction = this.availableActions[0].id;
    this.bulkForm.patchValue({ action: this.selectedAction });
  }

  updateValidators(): void {
    const categoryControl = this.bulkForm.get('category');
    const priceFixedAmountControl = this.bulkForm.get('priceFixedAmount');
    const pricePercentageControl = this.bulkForm.get('pricePercentage');
    
    // Reset all validators
    categoryControl?.clearValidators();
    priceFixedAmountControl?.clearValidators();
    pricePercentageControl?.clearValidators();
    
    // Set validators based on selected action
    switch (this.selectedAction) {
      case 'update-category':
        categoryControl?.setValidators([Validators.required]);
        break;
      case 'update-price':
        if (this.bulkForm.get('priceUpdateType')?.value === 'fixed') {
          priceFixedAmountControl?.setValidators([Validators.required, Validators.min(0)]);
        } else {
          pricePercentageControl?.setValidators([Validators.required, Validators.min(0), Validators.max(1000)]);
        }
        break;
    }
    
    // Update validity
    categoryControl?.updateValueAndValidity();
    priceFixedAmountControl?.updateValueAndValidity();
    pricePercentageControl?.updateValueAndValidity();
  }

  getActionLabel(): string {
    const action = this.availableActions.find(a => a.id === this.selectedAction);
    return action?.label || '';
  }

  getPriceUpdateSummary(): string {
    const type = this.bulkForm.get('priceUpdateType')?.value;
    const operation = this.bulkForm.get(type === 'fixed' ? 'priceFixedOperation' : 'pricePercentageOperation')?.value;
    const value = this.bulkForm.get(type === 'fixed' ? 'priceFixedAmount' : 'pricePercentage')?.value;
    
    if (type === 'fixed') {
      return `${operation === 'increase' ? 'Increase' : operation === 'decrease' ? 'Decrease' : 'Set'} by $${value}`;
    } else {
      return `${operation === 'increase' ? 'Increase' : 'Decrease'} by ${value}%`;
    }
  }

  getActionButtonText(): string {
    switch (this.selectedAction) {
      case 'activate': return 'Activate Products';
      case 'deactivate': return 'Deactivate Products';
      case 'delete': return 'Delete Products';
      case 'update-category': return 'Update Category';
      case 'update-price': return 'Update Prices';
      default: return 'Apply Action';
    }
  }

  getActionButtonColor(): string {
    switch (this.selectedAction) {
      case 'delete': return 'warn';
      default: return 'primary';
    }
  }

  getActionIcon(): string {
    switch (this.selectedAction) {
      case 'activate': return 'check_circle';
      case 'deactivate': return 'pause_circle';
      case 'delete': return 'delete';
      case 'update-category': return 'category';
      case 'update-price': return 'attach_money';
      default: return 'play_arrow';
    }
  }

  onSubmit(): void {
    if (this.bulkForm.valid) {
      const formValue = this.bulkForm.value;
      let result: any = { action: this.selectedAction };
      
      switch (this.selectedAction) {
        case 'update-category':
          result.category = formValue.category;
          break;
          
        case 'update-price':
          result.priceData = {
            type: formValue.priceUpdateType,
            value: formValue.priceUpdateType === 'fixed' 
              ? formValue.priceFixedAmount 
              : formValue.pricePercentage,
            operation: formValue.priceUpdateType === 'fixed'
              ? formValue.priceFixedOperation
              : formValue.pricePercentageOperation
          };
          break;
      }
      
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}