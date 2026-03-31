import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CurrencyUtilsPipe,
  UserInterface
} from '../../../../../../../../shared-services/src/public-api';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import { Product } from '../../../../models';

@Component({
  selector: 'app-related-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
    TruncatePipe
  ],
  templateUrl: './related-products.component.html',
  styleUrls: ['./related-products.component.scss']
})
export class RelatedProductsComponent {

  // ✅ SAFE DEFAULT VALUES (prevents undefined issues)
  private _products: Product[] = [];

  @Input({ required: true })
  set products(value: Product[] | null | undefined) {
    this._products = value ?? [];
    //console.log('✅ Related products updated:', this._products);
  }

  get products(): Product[] {
    return this._products;
  }

  @Input({ required: true }) loading: boolean = false;
  @Input({ required: true }) category: string = '';
  @Input({ required: true }) user!: UserInterface;

  @Output() productClick = new EventEmitter<Product>();

  // ✅ Emit correct product
  onProductClick(product: Product) {
    this.productClick.emit(product);
  }

  /* getCommissionColor(rate: number): string {
    if (rate >= 30) return 'high';
    if (rate >= 15) return 'medium';
    return 'low';
  } */
}