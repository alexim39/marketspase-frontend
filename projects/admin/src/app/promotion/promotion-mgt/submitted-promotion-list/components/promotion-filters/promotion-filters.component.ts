import { Component, Input, Output, EventEmitter, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

export interface Campaign {
  _id: string;
  title: string;
  category: string;
}

export interface PromotionFilters {
  search: string;
  campaignIds: string[];
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-promotion-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="filters-card" appearance="outlined">
      <mat-card-content>
        <div class="filters-header">
          <h3 class="filters-title">
            <mat-icon>filter_list</mat-icon>
            Filters
          </h3>
          <button mat-button 
                  color="warn" 
                  (click)="onClear()"
                  [disabled]="!hasActiveFilters()"
                  class="clear-all-btn">
            <mat-icon>clear_all</mat-icon>
            Clear All
          </button>
        </div>
        
        <mat-divider class="divider"></mat-divider>
        
        <div class="filters-container">
          <!-- Search Field -->
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input matInput 
                   [formControl]="filtersForm.controls.search"
                   placeholder="Search by UPI, promoter, campaign..."
                   type="search">
            <mat-icon matPrefix>search</mat-icon>
            @if (filtersForm.controls.search.value) {
              <button matSuffix 
                      mat-icon-button 
                      aria-label="Clear search"
                      (click)="clearSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          
          <!-- Campaign Filter -->
          <mat-form-field appearance="outline" class="campaign-field">
            <mat-label>Campaign</mat-label>
            <mat-select [formControl]="filtersForm.controls.campaignIds" multiple>
              <mat-option [value]="null" (click)="$event.stopPropagation()">
                <button mat-button 
                        class="select-all-btn"
                        (click)="toggleSelectAllCampaigns()">
                  {{ areAllCampaignsSelected() ? 'Deselect All' : 'Select All' }}
                </button>
              </mat-option>
              <mat-divider></mat-divider>
              @for (campaign of campaigns; track campaign._id) {
                <mat-option [value]="campaign._id">
                  <div class="campaign-option">
                    <span class="campaign-title">{{ campaign.title }}</span>
                    <span class="campaign-category">{{ campaign.category }}</span>
                  </div>
                </mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>campaign</mat-icon>
          </mat-form-field>
          
          <!-- Date Range Filter -->
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>Submission Date</mat-label>
            <mat-date-range-input [rangePicker]="picker" [formGroup]="dateRangeGroup">
              <input matStartDate 
                     formControlName="start"
                     placeholder="Start date">
              <input matEndDate 
                     formControlName="end"
                     placeholder="End date">
            </mat-date-range-input>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-date-range-picker #picker></mat-date-range-picker>
            <mat-icon matPrefix>calendar_today</mat-icon>
            @if (dateRangeGroup.value.start || dateRangeGroup.value.end) {
              <button matSuffix 
                      mat-icon-button 
                      aria-label="Clear dates"
                      (click)="clearDates()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          
          <!-- Quick Date Presets -->
          <div class="quick-dates">
            <span class="quick-dates-label">Quick range:</span>
            <div class="quick-date-buttons">
              <button mat-button 
                      size="small" 
                      (click)="setDateRange('today')"
                      [class.active]="isQuickRangeActive('today')">
                Today
              </button>
              <button mat-button 
                      size="small" 
                      (click)="setDateRange('week')"
                      [class.active]="isQuickRangeActive('week')">
                This Week
              </button>
              <button mat-button 
                      size="small" 
                      (click)="setDateRange('month')"
                      [class.active]="isQuickRangeActive('month')">
                This Month
              </button>
              <button mat-button 
                      size="small" 
                      (click)="setDateRange('year')"
                      [class.active]="isQuickRangeActive('year')">
                This Year
              </button>
            </div>
          </div>
        </div>
        
        <!-- Active Filters -->
        @if (hasActiveFilters()) {
          <mat-divider class="divider"></mat-divider>
          <div class="active-filters">
            <span class="active-filters-label">Active filters:</span>
            <div class="filter-chips">
              @if (filtersForm.controls.search.value) {
                <mat-chip (removed)="clearSearch()">
                  Search: "{{ filtersForm.controls.search.value }}"
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              }
              
              @if (filtersForm.controls.campaignIds.value?.length) {
                <mat-chip (removed)="clearCampaigns()">
                  Campaigns: {{ filtersForm.controls.campaignIds.value?.length }} selected
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              }
              
              @if (dateRangeGroup.value.start || dateRangeGroup.value.end) {
                <mat-chip (removed)="clearDates()">
                  Date: {{ getDateRangeLabel() }}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              }
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .filters-card {
      margin-bottom: 24px;
    }
    
    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .filters-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
    
    .clear-all-btn {
      mat-icon {
        margin-right: 4px;
      }
    }
    
    .divider {
      margin: 16px 0;
    }
    
    .filters-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .search-field {
      grid-column: 1 / -1;
    }
    
    .campaign-option {
      display: flex;
      flex-direction: column;
      
      .campaign-title {
        font-weight: 500;
      }
      
      .campaign-category {
        font-size: 12px;
        color: rgba(236, 236, 236, 0.6);
      }
    }
    
    .select-all-btn {
      width: 100%;
      text-align: left;
      font-size: 12px;
      padding: 4px 8px;
    }
    
    .quick-dates {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      
      .quick-dates-label {
        font-size: 12px;
        color: rgba(213, 212, 212, 0.6);
        white-space: nowrap;
      }
      
      .quick-date-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        
        button {
          font-size: 12px;
          padding: 0 12px;
          min-height: 28px;
          border-radius: 14px;
          
          &.active {
            background: #3f51b5;
            color: white;
          }
        }
      }
    }
    
    .active-filters {
      margin-top: 16px;
      
      .active-filters-label {
        display: block;
        font-size: 12px;
        color: rgba(201, 201, 201, 0.6);
        margin-bottom: 8px;
      }
      
      .filter-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        mat-chip {
          font-size: 12px;
          padding: 4px 8px;
          min-height: 24px;
          
          button {
            margin-left: 4px;
            
            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
            }
          }
        }
      }
    }
    
    @media (max-width: 768px) {
      .filters-container {
        grid-template-columns: 1fr;
      }
      
      .filters-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .clear-all-btn {
        align-self: flex-end;
      }
      
      .quick-dates {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class PromotionFiltersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  
  private _campaigns = signal<Campaign[]>([]);
  
  @Input({ required: true })
  set campaigns(value: Campaign[]) {
    this._campaigns.set(value);
  }
  
  get campaigns() {
    return this._campaigns();
  }
  
  @Input() initialFilters?: Partial<PromotionFilters>;
  @Output() filtersChange = new EventEmitter<PromotionFilters>();
  @Output() clearFilters = new EventEmitter<void>();
  
  filtersForm = this.fb.group({
    search: [''],
    campaignIds: [[] as string[]],
    startDate: [null as Date | null],
    endDate: [null as Date | null]
  });
  
  dateRangeGroup = this.fb.group({
    start: [null as Date | null],
    end: [null as Date | null]
  });
  
  activeQuickRange = signal<string | null>(null);
  
  ngOnInit(): void {
    // Apply initial filters if provided
    if (this.initialFilters) {
      this.filtersForm.patchValue({
        search: this.initialFilters.search || '',
        campaignIds: this.initialFilters.campaignIds || [],
        startDate: this.initialFilters.startDate || null,
        endDate: this.initialFilters.endDate || null
      });
      
      if (this.initialFilters.startDate || this.initialFilters.endDate) {
        this.dateRangeGroup.patchValue({
          start: this.initialFilters.startDate || null,
          end: this.initialFilters.endDate || null
        });
      }
    }
    
    // Watch for form changes
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.emitFilters();
      });
    
    // Watch for date range changes
    this.dateRangeGroup.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        this.filtersForm.patchValue({
          startDate: value.start,
          endDate: value.end
        }, { emitEvent: false });
      });
  }
  
  private emitFilters(): void {
    const value = this.filtersForm.value;
    this.filtersChange.emit({
      search: value.search || '',
      campaignIds: value.campaignIds || [],
      startDate: value.startDate || null,
      endDate: value.endDate || null
    });
  }
  
  hasActiveFilters(): boolean {
    const value = this.filtersForm.value;
    return !!(value.search || 
              value.campaignIds?.length || 
              value.startDate || 
              value.endDate);
  }
  
  areAllCampaignsSelected(): boolean {
    const selected = this.filtersForm.controls.campaignIds.value?.length || 0;
    const total = this.campaigns.length;
    return selected === total && total > 0;
  }
  
  toggleSelectAllCampaigns(): void {
    if (this.areAllCampaignsSelected()) {
      this.filtersForm.controls.campaignIds.setValue([]);
    } else {
      const allIds = this.campaigns.map(c => c._id);
      this.filtersForm.controls.campaignIds.setValue(allIds);
    }
  }
  
  clearSearch(): void {
    this.filtersForm.controls.search.setValue('');
  }
  
  clearCampaigns(): void {
    this.filtersForm.controls.campaignIds.setValue([]);
  }
  
  clearDates(): void {
    this.dateRangeGroup.patchValue({ start: null, end: null });
    this.activeQuickRange.set(null);
  }
  
  setDateRange(range: 'today' | 'week' | 'month' | 'year'): void {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
    }
    
    this.dateRangeGroup.patchValue({ start, end });
    this.activeQuickRange.set(range);
  }
  
  isQuickRangeActive(range: string): boolean {
    return this.activeQuickRange() === range;
  }
  
  getDateRangeLabel(): string {
    const start = this.dateRangeGroup.value.start;
    const end = this.dateRangeGroup.value.end;
    
    if (!start && !end) return '';
    
    const format = (date: Date) => date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: start?.getFullYear() !== end?.getFullYear() ? 'numeric' : undefined
    });
    
    if (start && end) {
      return `${format(start)} - ${format(end)}`;
    } else if (start) {
      return `From ${format(start)}`;
    } else {
      return `Until ${format(end!)}`;
    }
  }
  
  onClear(): void {
    this.filtersForm.reset({
      search: '',
      campaignIds: [],
      startDate: null,
      endDate: null
    });
    this.dateRangeGroup.reset({ start: null, end: null });
    this.activeQuickRange.set(null);
    this.clearFilters.emit();
  }
}