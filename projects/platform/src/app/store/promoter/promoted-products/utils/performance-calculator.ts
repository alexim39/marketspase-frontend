// utils/performance-calculator.ts
import { Injectable } from '@angular/core';

@Injectable()
export class PerformanceCalculator {
  calculate(stats: any): 'high' | 'medium' | 'low' {
    const conversionRate = stats.conversionRate || 0;
    const earnings = stats.earnings || 0;
    const clicks = stats.clicks || 0;
    
    if (conversionRate >= 5 || earnings > 100) {
      return 'high';
    } else if (conversionRate < 1 && earnings < 10 && clicks < 10) {
      return 'low';
    }
    return 'medium';
  }
}