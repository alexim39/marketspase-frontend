import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { StoreService } from '../../../../services/store.service';
import { MarketerProductListComponent } from '../marketer-product-list-index.component';
import { MarketerProductListManagementMobileComponent } from './marketer-product-list-management-mobile.component';

@Component({
  selector: 'app-marketer-product-list-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MarketerProductListManagementMobileComponent,
  ],
  providers: [StoreService],
  templateUrl: './marketer-product-list-mobile.component.html',
  styleUrls: ['./marketer-product-list-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerProductListMobileComponent extends MarketerProductListComponent {}
