import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormGroup } from '@angular/forms';
import { MediaFile } from '../../media-file.model';

@Component({
  selector: 'app-campaign-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './campaign-summary.component.html',
  styleUrls: ['./campaign-summary.component.scss']
})
export class CampaignSummaryComponent {
  @Input({ required: true }) contentForm!: FormGroup;
  @Input({ required: true }) budgetForm!: FormGroup;
  @Input({ required: true }) scheduleForm!: FormGroup;
  @Input() selectedMedia: MediaFile | null = null;
}