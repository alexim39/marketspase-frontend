import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'marketspase-video-guides',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './video-guides.component.html',
  styleUrls: ['./video-guides.component.scss']
})
export class VideoGuidesComponent {
  @Input() isMarketer: boolean = false;
  @Input() isPromoter: boolean = false;
  @Input() marketerVideoUrl: SafeResourceUrl | null = null;
  @Input() promoterVideoUrl: SafeResourceUrl | null = null;
}