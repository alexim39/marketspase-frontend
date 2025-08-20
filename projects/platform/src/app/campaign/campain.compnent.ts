import {Component} from '@angular/core';
import { RouterModule } from '@angular/router';


/**
 * @title Campaign
 */
@Component({
  selector: 'campaign',
  imports: [RouterModule],
  template: `
    <router-outlet/>
  `,
  styles: `
  `,
})
export class CampaignComponent {
}
