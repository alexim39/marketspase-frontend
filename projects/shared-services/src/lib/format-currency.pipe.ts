// format-currency.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCurrency',
  standalone: true
})
export class FormatCurrencyPipe implements PipeTransform {
  transform(value: number | undefined | null, currencyCode: string = 'NGN', display: 'symbol' | 'code' | 'name' = 'symbol'): string {
    // Handle null, undefined, or non-numeric values
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    // Format the currency based on the provided parameters
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: display,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } catch (error) {
      // Fallback formatting if Intl fails
      return `${this.getCurrencySymbol(currencyCode, display)}${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
    }
  }

  private getCurrencySymbol(currencyCode: string, display: 'symbol' | 'code' | 'name'): string {
    if (display === 'code') return `${currencyCode} `;
    if (display === 'name') return '';
    
    // Default symbols for common currencies
    const symbols: { [key: string]: string } = {
      NGN: '₦',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥'
    };
    
    return symbols[currencyCode] || `${currencyCode} `;
  }
}