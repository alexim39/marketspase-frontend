import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiService } from '@shared/services/api';

export interface NotificationPreferences {
  mutedCategories: string[];
  mutedTypes: string[];
}

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly apiService = inject(ApiService);

  private readonly prefsSubject = new BehaviorSubject<NotificationPreferences | null>(null);
  readonly preferences$ = this.prefsSubject.asObservable();

  getCached(): NotificationPreferences | null {
    return this.prefsSubject.value;
  }

  load(): Observable<{ success: boolean; data: NotificationPreferences }> {
    return this.apiService.get<any>('api/v1/notifications/preferences', undefined, undefined, true).pipe(
      tap((res) => {
        if (res?.success && res?.data) {
          this.prefsSubject.next({
            mutedCategories: Array.isArray(res.data.mutedCategories) ? res.data.mutedCategories : [],
            mutedTypes: Array.isArray(res.data.mutedTypes) ? res.data.mutedTypes : [],
          });
        }
      }),
      catchError((error) => {
        console.error('Failed to load notification preferences:', error);
        // Keep last known preferences (if any) and return a safe response.
        return of({ success: false, data: { mutedCategories: [], mutedTypes: [] } });
      })
    );
  }

  update(next: NotificationPreferences): Observable<{ success: boolean; data: NotificationPreferences }> {
    const payload: NotificationPreferences = {
      mutedCategories: Array.isArray(next?.mutedCategories) ? next.mutedCategories : [],
      mutedTypes: Array.isArray(next?.mutedTypes) ? next.mutedTypes : [],
    };

    return this.apiService.patch<any>('api/v1/notifications/preferences', payload, undefined, true).pipe(
      tap((res) => {
        if (res?.success && res?.data) {
          this.prefsSubject.next({
            mutedCategories: Array.isArray(res.data.mutedCategories) ? res.data.mutedCategories : payload.mutedCategories,
            mutedTypes: Array.isArray(res.data.mutedTypes) ? res.data.mutedTypes : payload.mutedTypes,
          });
        }
      }),
      catchError((error) => {
        console.error('Failed to update notification preferences:', error);
        return of({ success: false, data: payload });
      })
    );
  }
}

