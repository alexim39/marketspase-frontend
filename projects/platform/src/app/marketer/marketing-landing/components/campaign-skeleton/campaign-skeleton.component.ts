import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campaign-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-skeleton.component.html',
  styleUrls: ['./campaign-skeleton.component.scss']
})
export class CampaignSkeletonComponent {
  @Input() count = 4;
  @Input() view: 'grid' | 'list' = 'grid';

  get skeletonItems(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}