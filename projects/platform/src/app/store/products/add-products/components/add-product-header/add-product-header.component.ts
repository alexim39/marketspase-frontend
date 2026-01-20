// components/product-management/add-product/components/add-product-header/add-product-header.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-add-product-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-product-header.component.html',
  styleUrls: ['./add-product-header.component.scss']
})
export class AddProductHeaderComponent {
  loading = input<boolean>(false);
  storeId = input<string>();
  cancel = output<void>();
  submit = output<void>();
}