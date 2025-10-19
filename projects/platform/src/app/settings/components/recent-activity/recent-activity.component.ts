import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface DisplayActivity {
  icon: string;
  title: string;
  time: string;
  timestamp: Date;
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule
  ],
  templateUrl: './recent-activity.component.html',
  styleUrls: ['./recent-activity.component.scss'],
})
export class RecentActivityComponent {
  @Input() activities: DisplayActivity[] = [];
  @Input() initiallyExpanded = false; // Default to expanded
  
  isExpanded = this.initiallyExpanded;

  toggleActivities(): void {
    this.isExpanded = !this.isExpanded;
  }

  // Optional methods to control expansion programmatically
  expand(): void {
    this.isExpanded = true;
  }

  collapse(): void {
    this.isExpanded = false;
  }
}