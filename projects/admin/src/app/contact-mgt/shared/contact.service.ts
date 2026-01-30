
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface ContactMessage {
  _id: string;
  requestID: string;
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    email: string;
  };
  reason: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'spam';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  attachments: Array<{
    filename: string;
    url: string;
    fileType: string;
    size: number;
    uploadedAt: Date;
  }>;
  adminNotes: Array<{
    admin: any;
    note: string;
    createdAt: Date;
  }>;
  assignedTo: any;
  userEmail: string;
  userPhone?: string;
  metadata?: any;
  tags: string[];
  isRead: boolean;
  isArchived: boolean;
  followUpDate?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactStats {
  byStatus: Array<{ _id: string; count: number; avgResponseTime: number }>;
  total: number;
  openTickets: number;
  highPriority: number;
  averageResponseTime: number;
}

export interface ContactFilter {
  status?: string;
  priority?: string;
  category?: string;
  reason?: string;
  assignedTo?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isArchived?: boolean;
}

@Injectable()
export class ContactService {
  private apiUrl = 'contact';
  private apiService: ApiService = inject(ApiService);

  getContactMessages(filter?: ContactFilter, page: number = 1, limit: number = 20): Observable<{ data: ContactMessage[]; total: number; page: number; limit: number; stats: ContactStats }> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof ContactFilter];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.apiService.get<{ data: ContactMessage[]; total: number; page: number; limit: number; stats: ContactStats }>(this.apiUrl, params, undefined, true  );
  }

  getContactMessage(id: string): Observable<ContactMessage> {
    return this.apiService.get<ContactMessage>(`${this.apiUrl}/${id}`)
      .pipe(
        map(contact => ({
          ...contact,
          createdAt: new Date(contact.createdAt),
          updatedAt: new Date(contact.updatedAt),
          resolvedAt: contact.resolvedAt ? new Date(contact.resolvedAt) : undefined,
          followUpDate: contact.followUpDate ? new Date(contact.followUpDate) : undefined
        }))
      );
  }

  updateStatus(id: string, status: ContactMessage['status'], notes?: string): Observable<ContactMessage> {
    return this.apiService.patch<ContactMessage>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  updatePriority(id: string, priority: ContactMessage['priority']): Observable<ContactMessage> {
    return this.apiService.patch<ContactMessage>(`${this.apiUrl}/${id}/priority`, { priority });
  }

  assignToAdmin(id: string, adminId: string): Observable<ContactMessage> {
    return this.apiService.patch<ContactMessage>(`${this.apiUrl}/${id}/assign`, { adminId });
  }

  addNote(id: string, note: string): Observable<ContactMessage> {
    return this.apiService.post<ContactMessage>(`${this.apiUrl}/${id}/notes`, { note });
  }

  updateTags(id: string, tags: string[]): Observable<ContactMessage> {
    return this.apiService.patch<ContactMessage>(`${this.apiUrl}/${id}/tags`, { tags });
  }

  markAsRead(id: string): Observable<ContactMessage> {
    return this.apiService.patch<ContactMessage>(`${this.apiUrl}/${id}/read`, {});
  }

  markAsArchived(id: string, archived: boolean): Observable<ContactMessage> {
    return this.apiService.patch<ContactMessage>(`${this.apiUrl}/${id}/archive`, { archived });
  }

  setFollowUpDate(id: string, date: Date | null): Observable<ContactMessage> {
    return this.apiService.patch<ContactMessage>(`${this.apiUrl}/${id}/followup`, { date });
  }

  deleteContactMessage(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkUpdateStatus(ids: string[], status: ContactMessage['status']): Observable<{ success: boolean; updatedCount: number }> {
    return this.apiService.post<{ success: boolean; updatedCount: number }>(
      `${this.apiUrl}/bulk/status`,
      { ids, status }
    );
  }

  bulkAssign(ids: string[], adminId: string): Observable<{ success: boolean; updatedCount: number }> {
    return this.apiService.post<{ success: boolean; updatedCount: number }>(
      `${this.apiUrl}/bulk/assign`,
      { ids, adminId }
    );
  }

  bulkArchive(ids: string[], archive: boolean): Observable<{ success: boolean; updatedCount: number }> {
    return this.apiService.post<{ success: boolean; updatedCount: number }>(
      `${this.apiUrl}/bulk/archive`,
      { ids, archive }
    );
  }

  exportContacts(filter?: ContactFilter, format: string = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof ContactFilter];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.apiService.get(`${this.apiUrl}/export`, params, undefined, true );
  }

  getStats(): Observable<ContactStats> {
    return this.apiService.get<ContactStats>(`${this.apiUrl}/stats`);
  }

  getAdmins(): Observable<Array<{ _id: string; username: string; displayName: string }>> {
    return this.apiService.get<Array<{ _id: string; username: string; displayName: string }>>('/api/admin/users/admins');
  }
}
