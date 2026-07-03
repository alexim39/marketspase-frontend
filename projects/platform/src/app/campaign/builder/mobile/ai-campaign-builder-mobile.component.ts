import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AiCampaignBuilderComponent } from '../ai-campaign-builder.component';

@Component({
  selector: 'app-ai-campaign-builder-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './ai-campaign-builder-mobile.component.html',
  styleUrls: ['./ai-campaign-builder-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiCampaignBuilderMobileComponent extends AiCampaignBuilderComponent {}
