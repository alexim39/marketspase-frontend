import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-loader.component.html',
  styleUrls: ['./product-loader.component.scss']
})
export class ProductLoaderComponent {
  loading = input<boolean>(false);
  showSidebar = input<boolean>(true);
  showTabs = input<boolean>(true);
}