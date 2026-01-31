// shared/pipes/currency.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currency',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currencyCode: string = 'USD', display: 'symbol' | 'code' | 'name' = 'symbol'): string {
    if (value == null) {
      return '';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numericValue)) {
      return '';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: display,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericValue);
    } catch (error) {
      // Fallback formatting
      return `$${numericValue.toFixed(2)}`;
    }
  }
}