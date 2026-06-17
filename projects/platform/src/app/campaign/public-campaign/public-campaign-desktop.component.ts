import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PublicCampaignBase } from './public-campaign-base';

@Component({
  selector: 'app-public-campaign-desktop',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './public-campaign-desktop.component.html',
  styleUrls: ['./public-campaign-desktop.component.scss'],
})
export class PublicCampaignDesktopComponent extends PublicCampaignBase {}
