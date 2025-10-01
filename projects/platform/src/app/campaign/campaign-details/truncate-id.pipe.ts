import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateID'
})
export class TruncateIDPipe implements PipeTransform {
  transform(value: string, length: number = 4): string {
    if (!value) return value;
    return `...${value.slice(-length)}`;
  }
}