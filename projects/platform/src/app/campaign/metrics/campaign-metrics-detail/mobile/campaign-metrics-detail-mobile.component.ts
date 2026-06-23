import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CampaignMetricsDetailComponent } from '../campaign-metrics-detail.component';

@Component({
  selector: 'app-campaign-metrics-detail-mobile',
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
  templateUrl: './campaign-metrics-detail-mobile.component.html',
  styleUrls: ['./campaign-metrics-detail-mobile.component.scss'],
})
export class CampaignMetricsDetailMobileComponent extends CampaignMetricsDetailComponent {}
