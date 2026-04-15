import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { SwitchUserRoleService } from '../../../common/services/switch-user-role.service';
import {MatTabsModule} from '@angular/material/tabs';

@Component({
  selector: 'marketspase-video-guides',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTabsModule],
  templateUrl: './video-guides.component.html',
  styleUrls: ['./video-guides.component.scss']
})
export class VideoGuidesComponent {
  @Input() isMarketer: boolean = false;
  @Input() isPromoter: boolean = false;
  @Input() marketerVideoUrl: SafeResourceUrl | null = null;
  @Input() promoterVideoUrl: SafeResourceUrl | null = null;

  private switchUserRoleService = inject(SwitchUserRoleService);

   switchUserRole(role: string) {
    // 6. Broadcast the signal to switch user role on sidenav.component
    this.switchUserRoleService.sendSwitchRequest(role);
  }
}