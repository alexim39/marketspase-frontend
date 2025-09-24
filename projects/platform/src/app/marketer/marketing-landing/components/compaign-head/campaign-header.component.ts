import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-campaign-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './campaign-header.component.html',
  styleUrls: ['./campaign-header.component.scss']
})
export class CampaignHeaderComponent {
  @Output() createCampaign = new EventEmitter<void>();

  onCreateCampaign(): void {
    this.createCampaign.emit();
  }
}