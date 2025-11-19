import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface NewsletterResponse {
  success: boolean;
  data: any;
  message?: string;
}

export interface Newsletter {
  _id: string;
  subject: string;
  previewText: string;
  content: string;
  recipientType: 'all' | 'marketers' | 'promoters' | 'external';
  recipientCount: number;
  externalEmails?: string[];
  status: 'draft' | 'scheduled' | 'sent';
  sentDate: Date;
  openRate: number;
  clickRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNewsletterRequest {
  subject: string;
  previewText: string;
  content: string;
  recipientType: 'all' | 'marketers' | 'promoters' | 'external';
  externalEmails?: string[];
  sendOption: 'draft' | 'now' | 'schedule';
  scheduledDate?: Date;
  scheduledTime?: string;
  createdBy?: string;
  title?: string;
}

export interface UpdateNewsletterRequest extends CreateNewsletterRequest {
  id: string;
}

export interface NewsletterStats {
  total: number;
  draft: number;
  scheduled: number;
  sent: number;
  totalSent: number;
  openRate: number;
  clickRate: number;
}

export interface NewsletterListResponse {
  success: boolean;
  data: Newsletter[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'newsletter';

  // Get all newsletters with optional filtering - FIXED
  getNewsletters(params?: {
    status?: 'all' | 'draft' | 'scheduled' | 'sent';
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<NewsletterListResponse> {
    // Convert params to URLSearchParams or query string
    let queryParams = '';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.status && params.status !== 'all') searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      queryParams = searchParams.toString() ? `?${searchParams.toString()}` : '';
    }

    return this.apiService.get<NewsletterListResponse>(`${this.apiUrl}/admin/newsletters${queryParams}`);
  }

  // Get newsletter by ID
  getNewsletterById(id: string): Observable<NewsletterResponse> {
    return this.apiService.get<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}`);
  }

  // Create new newsletter
  createNewsletter(newsletterData: CreateNewsletterRequest): Observable<NewsletterResponse> {
    return this.apiService.post<NewsletterResponse>(`${this.apiUrl}/admin/newsletters`, newsletterData);
  }

  // Update existing newsletter
  updateNewsletter(id: string, newsletterData: UpdateNewsletterRequest): Observable<NewsletterResponse> {
    return this.apiService.put<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}`, newsletterData);
  }

  // Delete newsletter
  deleteNewsletter(id: string): Observable<NewsletterResponse> {
    return this.apiService.delete<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}`);
  }

  // Duplicate newsletter
  duplicateNewsletter(id: string): Observable<NewsletterResponse> {
    return this.apiService.post<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}/duplicate`, {});
  }

  // Send newsletter immediately
  sendNewsletter(id: string): Observable<NewsletterResponse> {
    return this.apiService.post<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}/send`, {});
  }

  // Schedule newsletter
  scheduleNewsletter(id: string, scheduleDate: Date): Observable<NewsletterResponse> {
    return this.apiService.post<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}/schedule`, {
      scheduledDate: scheduleDate
    });
  }

  // Cancel scheduled newsletter
  cancelScheduledNewsletter(id: string): Observable<NewsletterResponse> {
    return this.apiService.post<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}/cancel-schedule`, {});
  }

  // Save as draft
  saveAsDraft(id: string): Observable<NewsletterResponse> {
    return this.apiService.post<NewsletterResponse>(`${this.apiUrl}/admin/newsletters/${id}/save-draft`, {});
  }

  // Get newsletter statistics
  getNewsletterStats(): Observable<{ success: boolean; data: NewsletterStats }> {
    return this.apiService.get<{ success: boolean; data: NewsletterStats }>(`${this.apiUrl}/admin/newsletters/stats`);
  }

  // Get recipient counts for different types
  getRecipientCounts(): Observable<{ success: boolean; data: { all: number; marketers: number; promoters: number } }> {
    return this.apiService.get<{ success: boolean; data: { all: number; marketers: number; promoters: number } }>(
      `${this.apiUrl}/admin/newsletters/recipient-counts`
    );
  }

  // Validate external emails
  validateExternalEmails(emails: string[]): Observable<{ success: boolean; data: { valid: string[]; invalid: string[] } }> {
    return this.apiService.post<{ success: boolean; data: { valid: string[]; invalid: string[] } }>(
      `${this.apiUrl}/admin/newsletters/validate-emails`,
      { emails }
    );
  }

  // Upload CSV with emails
  uploadEmailCSV(file: File): Observable<{ success: boolean; data: { emails: string[]; total: number; duplicates: number } }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.apiService.post<{ success: boolean; data: { emails: string[]; total: number; duplicates: number } }>(
      `${this.apiUrl}/admin/newsletters/upload-emails`,
      formData
    );
  }
}