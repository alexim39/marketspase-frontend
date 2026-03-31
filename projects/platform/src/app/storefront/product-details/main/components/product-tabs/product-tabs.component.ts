import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-product-tabs',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatExpansionModule],
  templateUrl: './product-tabs.component.html',
  styleUrls: ['./product-tabs.component.scss']
})
export class ProductTabsComponent {
  @Input() product: any = null;
  @Input() selectedTab: number = 0;
  @Output() selectedTabChange = new EventEmitter<number>();
  
  isDescriptionExpanded = signal<boolean>(false);
  
  tabs = [
    { id: 0, label: 'Description', icon: 'description' },
    { id: 1, label: 'Specifications', icon: 'settings' },
    { id: 2, label: 'Reviews', icon: 'star' },
    { id: 3, label: 'Shipping & Returns', icon: 'local_shipping' }
  ];
  
  toggleDescription(): void {
    this.isDescriptionExpanded.set(!this.isDescriptionExpanded());
  }
  
  selectTab(id: number): void {
    this.selectedTabChange.emit(id);
  }
}