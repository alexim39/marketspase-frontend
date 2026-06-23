import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { PromoterMetricsDetailComponent } from '../promoter-metrics-detail.component';

@Component({
  selector: 'app-promoter-metrics-detail-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  providers: [DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './promoter-metrics-detail-mobile.component.html',
  styleUrls: ['./promoter-metrics-detail-mobile.component.scss'],
})
export class PromoterMetricsDetailMobileComponent extends PromoterMetricsDetailComponent {}
