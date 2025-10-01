// shorten-id.pipe.ts (new file)
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenId',
  standalone: true
})
export class ShortenIdPipe implements PipeTransform {
  transform(value: string, length: number = 6): string {
    if (!value || value.length <= length * 2) return value;
    return `${value.substring(0, length)}...${value.substring(value.length - length)}`;
  }
}