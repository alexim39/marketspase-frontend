import { Component, Input } from "@angular/core";
import { Store } from "../../models/store.model";

@Component({
  selector: 'app-store-analytics',
  standalone: true,
  template: `
  ` 
})
export class StoreAnalyticsComponent {
  @Input() store!: Store;
  
  // Analytics charts and data visualization
}