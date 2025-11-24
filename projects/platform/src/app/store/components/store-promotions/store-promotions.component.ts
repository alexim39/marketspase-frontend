import { Component, Input } from "@angular/core";
import { Store } from "../../models/store.model";


@Component({
  selector: 'app-store-promotions',
  standalone: true,
  template: `<div>
    <h2>Store Promotions</h2>
    <!-- Promotion management UI goes here -->`
})
export class StorePromotionsComponent {
  @Input() store!: Store;
  
  // Integration with existing campaign system
}