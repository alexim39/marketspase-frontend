import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface PromotionStats {
  total: number;
  pending: number;
  submitted: number;
  validated: number;
  paid: number;
  rejected: number;
}

@Component({
  selector: 'app-stats-overview',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './stats-overview.component.html',
  styleUrls: ['./stats-overview.component.scss']
})
export class StatsOverviewComponent {
  @Input({ required: true }) stats!: PromotionStats;
}