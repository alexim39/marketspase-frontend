import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Product, Store } from "../../models/store.model";

@Component({
  selector: 'app-product-management',
  standalone: true,
  template: ``
})
export class ProductManagementComponent {
  @Input() store!: Store;
  @Input() products!: Product[];
  @Output() productUpdated = new EventEmitter<void>();
  
  // Product management logic with signals
}