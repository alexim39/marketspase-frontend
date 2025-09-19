import { Component, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';

interface CampaignMetrics {
  totalEarnings: number;
  rating: number;
  completedPromotions: number;
}

@Component({
  selector: 'promoter-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promoter-header.component.html',
  styleUrls: ['./promoter-header.component.scss']
})
export class PromoterHeaderComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Input({ required: true }) metrics!: CampaignMetrics;
}