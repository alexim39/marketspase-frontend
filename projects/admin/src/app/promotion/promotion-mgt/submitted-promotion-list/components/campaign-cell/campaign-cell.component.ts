import { Component, Input, signal, computed, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

export interface Campaign {
  _id: string;
  title: string;
  category: string;
  payoutPerPromotion: number;
  owner?: any;
}

export interface Promotion {
  campaign: string | Campaign;
  [key: string]: any;
}

@Component({
  selector: 'app-campaign-cell',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIconModule],
  template: `
    <div class="campaign-cell" [matTooltip]="tooltip()" matTooltipPosition="above">
      <div class="campaign-content">
        <div class="campaign-main">
          <span class="campaign-title" [class.truncated]="truncate">
            {{ campaign().title }}
          </span>
          @if (showCategory) {
            <span class="campaign-category">{{ campaign().category }}</span>
          }
        </div>
        
        @if (showPayout) {
          <div class="campaign-payout">
            <mat-icon class="payout-icon">currency_exchange</mat-icon>
            <span class="payout-amount">
              {{ campaign().payoutPerPromotion | currency:'NGN':'₦' }}
            </span>
          </div>
        }
        
        @if (clickable) {
          <button mat-icon-button 
                  class="view-button"
                  (click)="onView.emit(campaign())">
            <mat-icon>open_in_new</mat-icon>
          </button>
        }
      </div>
      
      @if (showTags && campaignTags().length > 0) {
        <div class="campaign-tags">
          @for (tag of campaignTags(); track tag) {
            <span class="campaign-tag">{{ tag }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .campaign-cell {
      min-height: 56px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .campaign-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .campaign-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    
    .campaign-title {
      font-weight: 500;
      font-size: 14px;
      color: rgba(232, 232, 232, 0.87);
      line-height: 1.3;
      
      &.truncated {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .campaign-category {
      font-size: 12px;
      color: rgba(201, 201, 201, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .campaign-payout {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(76, 175, 80, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      
      .payout-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #4caf50;
      }
      
      .payout-amount {
        font-weight: 500;
        color: #2e7d32;
      }
    }
    
    .view-button {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .campaign-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    
    .campaign-tag {
      font-size: 10px;
      padding: 2px 6px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 10px;
      font-weight: 500;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .campaign-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .campaign-payout {
        align-self: flex-start;
      }
      
      .view-button {
        position: absolute;
        right: 8px;
        top: 8px;
      }
    }
  `]
})
export class CampaignCellComponent {
  private _promotion = signal<Promotion | null>(null);
  private _campaigns = signal<Campaign[]>([]);
  
  @Input({ required: true })
  set promotion(value: Promotion) {
    this._promotion.set(value);
    this.updateCampaign();
  }
  
  @Input()
  set campaigns(value: Campaign[]) {
    this._campaigns.set(value);
    this.updateCampaign();
  }
  
  @Input() showCategory = true;
  @Input() showPayout = false;
  @Input() showTags = false;
  @Input() truncate = false;
  @Input() clickable = false;
  
  @Output() view = new EventEmitter<Campaign>();
  
  campaign = signal<Campaign>({
    _id: '',
    title: 'Unknown Campaign',
    category: 'Unknown',
    payoutPerPromotion: 0
  });
  
  tooltip = computed(() => {
    const camp = this.campaign();
    return `${camp.title} - ${camp.category}`;
  });
  
  campaignTags = computed(() => {
    const tags = [];
    const camp = this.campaign();
    
    if (camp.category) {
      tags.push(camp.category);
    }
    
    if (this.showPayout && camp.payoutPerPromotion > 0) {
      tags.push(`₦${camp.payoutPerPromotion}`);
    }
    
    return tags;
  });
  
  private updateCampaign(): void {
    const promotion = this._promotion();
    if (!promotion) return;
    
    if (typeof promotion.campaign === 'string') {
      const foundCampaign = this._campaigns().find(c => c._id === promotion.campaign);
      if (foundCampaign) {
        this.campaign.set(foundCampaign);
      }
    } else {
      this.campaign.set(promotion.campaign);
    }
  }
  
  protected onView = this.view;
}