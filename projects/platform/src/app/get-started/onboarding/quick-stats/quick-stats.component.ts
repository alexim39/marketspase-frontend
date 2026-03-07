import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'marketspase-quick-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './quick-stats.component.html',
  styleUrls: ['./quick-stats.component.scss']
})
export class QuickStatsComponent {
  @Input() stats: any[] = [];

  trackByLabel(index: number, stat: any): string {
    return stat.label;
  }
}