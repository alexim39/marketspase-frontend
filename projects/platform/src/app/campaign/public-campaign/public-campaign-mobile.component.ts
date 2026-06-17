import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicCampaignBase } from './public-campaign-base';

@Component({
  selector: 'app-public-campaign-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-campaign-mobile.component.html',
  styleUrls: ['./public-campaign-mobile.component.scss'],
})
export class PublicCampaignMobileComponent extends PublicCampaignBase {}
