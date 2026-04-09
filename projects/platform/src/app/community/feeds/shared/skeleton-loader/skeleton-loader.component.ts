import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  @Input() count: number = 3;
  @Input() mobileCount: number = 2;
  @Input() isMobile: boolean = false;
  @Input() showCreatePost: boolean = true;
  @Input() showFeatured: boolean = true;
  @Input() showCaptions: boolean = false;
}