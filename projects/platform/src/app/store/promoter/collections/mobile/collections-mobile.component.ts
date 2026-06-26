import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { CollectionsListComponent } from '../collections-list.component';

@Component({
  selector: 'app-collections-list-mobile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule, RouterModule],
  templateUrl: './collections-list-mobile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsListMobileComponent extends CollectionsListComponent {}

@Component({
  selector: 'app-collections-detail-mobile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule, RouterModule],
  templateUrl: './collections-detail-mobile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsDetailMobileComponent {}
