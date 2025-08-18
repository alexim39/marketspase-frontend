import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizeHtml',
  standalone: true
})
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml | null {
    if (!value) return null;
    
    // First sanitize the content to remove potentially dangerous elements
    const sanitized = this.sanitizer.sanitize(
      SecurityContext.HTML,
      value
    );
    
    // Then bypass security to allow safe HTML to be rendered
    return this.sanitizer.bypassSecurityTrustHtml(sanitized || '');
  }
}