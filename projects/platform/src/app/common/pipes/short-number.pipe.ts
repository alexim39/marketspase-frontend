import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortNumber',
  standalone: true
})
export class ShortNumberPipe implements PipeTransform {
  transform(value: number | string): string {
    if (!value ||  value === undefined || value === null) return '0';
    const num = Number(value); // keep it as a number

    if (num >= 1_000_000_000) {
      return Math.floor(num / 1_000_000_000) + 'B+';
    }
    if (num >= 1_000_000) {
      return Math.floor(num / 1_000_000) + 'M+';
    }
    if (num >= 1_000) {
      return Math.floor(num / 1_000) + 'K+';
    }
    return num.toString() + '+'; // append "+" for small numbers too
  }
}
