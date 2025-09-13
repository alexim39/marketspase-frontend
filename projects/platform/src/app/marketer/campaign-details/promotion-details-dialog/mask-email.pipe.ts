import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskEmail',
  standalone: true
})
export class MaskEmailPipe implements PipeTransform {
  transform(email: string): string {
    if (!email) return '';
    
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    
    // Mask all but first 2 and last 2 characters of username
    const maskedUsername = username.length > 4 
      ? username.substring(0, 2) + '*'.repeat(username.length - 4) + username.substring(username.length - 2)
      : username.substring(0, 1) + '*'.repeat(username.length - 1);
    
    return maskedUsername + '@' + domain;
  }
}