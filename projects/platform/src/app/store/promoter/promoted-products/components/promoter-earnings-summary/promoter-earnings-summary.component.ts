// promoted-products/components/promoter-earnings-summary/promoter-earnings-summary.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'promoter-earnings-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promoter-earnings-summary.component.html',
  styleUrls: ['./promoter-earnings-summary.component.scss']
})
export class PromoterEarningsSummaryComponent {
  @Input({ required: true }) totalStats!: any;
  @Input({ required: true }) performanceBreakdown!: any;
  @Input({ required: true }) formatCurrency!: (amount: number) => string;
}