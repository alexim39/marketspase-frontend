import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CampaignMetricsComponent } from '../campaign-metrics.component';

@Component({
  selector: 'app-campaign-metrics-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  providers: [DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './campaign-metrics-mobile.component.html',
  styleUrls: ['./campaign-metrics-mobile.component.scss'],
})
export class CampaignMetricsMobileComponent extends CampaignMetricsComponent {}
