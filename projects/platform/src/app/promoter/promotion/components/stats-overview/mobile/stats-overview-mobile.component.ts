// stats-overview-mobile.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface PromotionStats {
  total: number;
  accepted: number;
  submitted: number;
  validated: number;
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
      pending: 'Pending Submission',
      submitted: 'Pending Validation',
      validated: 'Validated',
      paid: 'Paid',
      rejected: 'Rejected'
    };
    return labels[statType] || statType;
  }

  getStatIcon(statType: string): string {
    const icons: { [key: string]: string } = {
      total: 'campaign',
      pending: 'pending_actions',
      submitted: 'hourglass_empty',
      validated: 'check_circle',
      paid: 'paid',
      rejected: 'cancel'
    };
    return icons[statType] || 'help';
  }

  getStatusText(statType: string): string {
    const status: { [key: string]: string } = {
      pending: 'Requires Action',
      submitted: 'In Review',
      validated: 'Approved',
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
    if (this.activeStat && this.stats || this.activeStat !== '') {
      return this.stats[this.activeStat as keyof PromotionStats];
    }
    return 0;
  }
}