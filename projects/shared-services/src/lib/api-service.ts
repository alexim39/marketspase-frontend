import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, retry, throwError } from 'rxjs';

const DEFAULT_LOCAL_API_URL = 'http://localhost:8080';
//const DEFAULT_PRODUCTION_API_URL = 'api.marketspase.com';
 const DEFAULT_PRODUCTION_API_URL = 'https://apimarketspase1-hyrqzkeb.b4a.run';

const resolveApiBaseUrl = (): string => {
  const override = (globalThis as { __MARKETSPASE_API_URL__?: string }).__MARKETSPASE_API_URL__;
  if (override && /^https?:\/\//i.test(override)) {
    return override.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return DEFAULT_LOCAL_API_URL;
    }

    if (host.endsWith('marketspase.com')) {
      return DEFAULT_PRODUCTION_API_URL;
    }
  }

  return DEFAULT_LOCAL_API_URL;
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly domain = resolveApiBaseUrl();

  public getBaseUrl(): string {
    return this.domain; 
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Service: An error occurred:', error);
    return throwError(() => error);
  }

  constructor(private http: HttpClient) {}

  public get<T>(endpoint: string, params?: HttpParams, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.get<T>(`${this.domain}/${endpoint}`, { params, headers, withCredentials }).pipe(
      retry({ count: 1, delay: 0 }),
      catchError(this.handleError)
    );
  }

  public post<T>(endpoint: string, data: any, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.post<T>(`${this.domain}/${endpoint}`, data, { headers, withCredentials }).pipe(
      catchError(this.handleError)
    );
  }

  public put<T>(endpoint: string, data: any, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.put<T>(`${this.domain}/${endpoint}`, data, { headers, withCredentials }).pipe(
      catchError(this.handleError)
    );
  }

  public delete<T>(endpoint: string, params?: HttpParams, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.delete<T>(`${this.domain}/${endpoint}`, { params, headers, withCredentials }).pipe(
      catchError(this.handleError)
    );
  }

  public patch<T>(endpoint: string, data: any, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.patch<T>(`${this.domain}/${endpoint}`, data, { headers, withCredentials }).pipe(
      catchError(this.handleError)
    );
  }

  public head<T>(endpoint: string, params?: HttpParams, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.head<T>(`${this.domain}/${endpoint}`, { params, headers, withCredentials }).pipe(
      retry({ count: 1, delay: 0 }),
      catchError(this.handleError)
    );
  }
}
