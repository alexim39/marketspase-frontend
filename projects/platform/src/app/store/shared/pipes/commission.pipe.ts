// shared/pipes/commission.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commission',
  standalone: true
})
export class CommissionPipe implements PipeTransform {
  transform(value: number, type: 'percentage' | 'fixed' = 'percentage'): string {
    if (type === 'percentage') {
      return `${value}%`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }
}