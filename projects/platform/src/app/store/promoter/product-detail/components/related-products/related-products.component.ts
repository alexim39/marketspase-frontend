import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyUtilsPipe } from '../../../../../../../../shared-services/src/public-api';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-related-products',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CurrencyUtilsPipe, TruncatePipe],
  templateUrl: './related-products.component.html',
  styleUrls: ['./related-products.component.scss']
})
export class RelatedProductsComponent {
  @Input() products: any[] = [];
  @Input() loading: boolean = false;
  @Input() category: string = '';
  @Input() user: any;
  @Output() productClick = new EventEmitter<string>();

  // Method to get commission color
  getCommissionColor(rate: number): string {
    if (rate >= 30) return 'high';
    if (rate >= 15) return 'medium';
    return 'low';
  }
}