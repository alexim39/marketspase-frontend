import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TargetingComponent } from '../components/targeting/targeting.component';
import { CampaignTargetingComponent } from '../targeting.component';
import { CampaignTargetingService } from '../targeting.service';

@Component({
  selector: 'app-campaign-targeting-mobile',
  standalone: true,
  providers: [CampaignTargetingService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TargetingComponent,
  ],
  templateUrl: './campaign-targeting-mobile.component.html',
  styleUrls: ['./campaign-targeting-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignTargetingMobileComponent extends CampaignTargetingComponent {
  protected readonly campaignTitle = computed(() => this.campaign()?.title || 'Campaign targeting');
  protected readonly locationCount = computed(() => this.targetLocations().length);
  protected readonly selectedLocationPreview = computed(() => this.targetLocations().slice(0, 4));
  protected readonly hasEmptyEnabledTargeting = computed(() => this.enableTarget() && this.locationCount() === 0);

  protected readonly targetingStateLabel = computed(() => (
    this.enableTarget() ? 'Location targeting on' : 'Broad campaign reach'
  ));

  protected readonly targetingStateDetail = computed(() => {
    if (!this.enableTarget()) {
      return 'Promoters can share this campaign with a wider audience.';
    }

    const count = this.locationCount();
    return count === 1 ? '1 selected area' : `${count} selected areas`;
  });
}
