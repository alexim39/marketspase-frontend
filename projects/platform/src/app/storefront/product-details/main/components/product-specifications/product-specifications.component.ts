import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-product-specifications',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './product-specifications.component.html',
  styleUrls: ['./product-specifications.component.scss']
})
export class ProductSpecificationsComponent {
  @Input() product: any = null;
}