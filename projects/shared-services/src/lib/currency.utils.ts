
// src/app/shared/pipes/app-currency.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyUtils',
  standalone: true // Allows it to be imported directly into any component
})
export class CurrencyUtilsPipe implements PipeTransform {
  transform(amount: number | null | undefined | any, currency?: string): string {
    return formatAppCurrency(amount, currency);
  }
}


function formatAppCurrency(amount: number | null | undefined, currency?: string): string {
  // 1. Determine symbol (default to Naira)
  const symbol = currency && currency.trim() !== '' ? currency : '₦';

  // 2. Handle invalid numbers
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol}0.00`;
  }
  
  // 3. Format using Nigerian locale for proper comma placement
  const formattedValue = amount.toLocaleString('en-NG', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return `${symbol}${formattedValue}`;
}
