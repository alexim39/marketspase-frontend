import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-store-info-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './store-info-card.component.html',
  styleUrls: ['./store-info-card.component.scss']
})
export class StoreInfoCardComponent {
  @Input() store: any;
  @Input() user: any;
}