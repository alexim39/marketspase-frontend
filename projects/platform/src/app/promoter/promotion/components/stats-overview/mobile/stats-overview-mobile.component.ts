// stats-overview-mobile.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface PromotionStats {
  total: number;
  active: number;
  totalClicks: number;
  billableClicks: number;
  earnings: number;
  paid: number;
  rejected: number;
}

@Component({
  selector: 'app-stats-overview-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stats-overview-mobile.component.html',
  styleUrls: ['./stats-overview-mobile.component.scss']
})
export class StatsOverviewMobileComponent {
  @Input({ required: true }) stats!: PromotionStats;
  @Output() statSelected = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();

  activeStat: keyof PromotionStats | '' = '';
  isCompactView: boolean = true;
  sheetExpanded: boolean = false;

  onStatClick(statType: keyof PromotionStats): void {
    this.activeStat = this.activeStat === statType ? '' : statType;
    this.sheetExpanded = false;
    this.statSelected.emit(statType);
  }

  toggleCompactView(): void {
    this.isCompactView = !this.isCompactView;
    if (this.isCompactView) {
      this.activeStat = '';
    }
  }

  toggleSheet(): void {
    this.sheetExpanded = !this.sheetExpanded;
  }

  closeSheet(): void {
    this.activeStat = '';
    this.sheetExpanded = false;
  }

  getStatLabel(statType: string): string {
    const labels: { [key: string]: string } = {
      total: 'Total Promotions',
      active: 'Active Links',
      totalClicks: 'Total Clicks',
      billableClicks: 'Billable Clicks',
      earnings: 'Earned',
      paid: 'Paid',
      rejected: 'Rejected'
    };
    return labels[statType] || statType;
  }

  getStatIcon(statType: string): string {
    const icons: { [key: string]: string } = {
      total: 'campaign',
      active: 'link',
      totalClicks: 'touch_app',
      billableClicks: 'check_circle',
      earnings: 'paid',
      paid: 'paid',
      rejected: 'cancel'
    };
    return icons[statType] || 'help';
  }

  getStatusText(statType: string): string {
    const status: { [key: string]: string } = {
      active: 'Live',
      totalClicks: 'Tracked',
      billableClicks: 'Charged',
      earnings: 'Accumulated',
      paid: 'Completed',
      rejected: 'Needs Attention'
    };
    return status[statType] || 'Active';
  }

  onViewDetails(): void {
    if (this.activeStat) {
      this.viewDetails.emit(this.activeStat);
    }
  }

  getActiveStatValue(): number {
    if (this.activeStat && this.stats) {
      return this.stats[this.activeStat as keyof PromotionStats];
    }
    return 0;
  }
}
