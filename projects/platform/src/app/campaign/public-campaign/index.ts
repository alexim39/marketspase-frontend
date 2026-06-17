import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-public-campaign',
  standalone: true,
  template: `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;color:#6b7280">Loading...</div>`,
})
export class PublicCampaignComponent implements OnInit {
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const upi = this.route.snapshot.paramMap.get('upi');
    if (upi) {
      window.location.href = `/api/v1/campaign/track/${upi}?preview=1`;
    }
  }
}

@Component({
  selector: 'app-public-campaign-index',
  standalone: true,
  imports: [PublicCampaignComponent],
  template: `<app-public-campaign />`,
})
export class PublicCampaignIndexComponent {}
