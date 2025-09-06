import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'campaign-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-filters.component.html',
  styleUrls: ['./campaign-filters.component.scss']
})
export class CampaignFiltersComponent {
  @Input({ required: true }) searchTerm!: string;
  @Input({ required: true }) allCampaignsCount!: number;
  @Input({ required: true }) highPayoutCount!: number;
  @Input({ required: true }) expiringSoonCount!: number;
  @Input({ required: true }) quickTasksCount!: number;

  @Output() searchTermChange = new EventEmitter<string>();
}