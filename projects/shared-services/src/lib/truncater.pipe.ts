import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true // Remove if using an older version without Standalone Components
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + '...' : value;
  }
}
