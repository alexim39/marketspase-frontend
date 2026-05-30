import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PromotionCardComponent } from '../promotion-card.component';

@Component({
  selector: 'app-promotion-card-mobile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TitleCasePipe],
  templateUrl: './promotion-card-mobile.component.html',
  styleUrls: ['./promotion-card-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromotionCardMobileComponent extends PromotionCardComponent {}
