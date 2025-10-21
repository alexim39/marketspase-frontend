import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  //private readonly baseUrl = 'https://apimarketspase1-hyrqzkeb.b4a.run';
  private readonly baseUrl = 'http://localhost:8080'; // For local testing

  public getBaseUrl(): string {
    return this.baseUrl; 
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Service: An error occurred:', error);
    return throwError(() => error);
  }

  constructor(private http: HttpClient) {}

  public get<T>(endpoint: string, params?: HttpParams, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params, headers, withCredentials }).pipe(
      retry({ count: 1, delay: 0 }),
      catchError(this.handleError)
    );
  }

  public post<T>(endpoint: string, data: any, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data, { headers, withCredentials }).pipe(
      retry({ count: 1, delay: 0 }),
      catchError(this.handleError)
    );
  }

  public put<T>(endpoint: string, data: any, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data, { headers, withCredentials }).pipe(
      retry({ count: 1, delay: 0 }),
      catchError(this.handleError)
    );
  }

  public delete<T>(endpoint: string, params?: HttpParams, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { params, headers, withCredentials }).pipe(
      retry({ count: 1, delay: 0 }),
      catchError(this.handleError)
    );
  }

  public patch<T>(endpoint: string, data: any, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, data, { headers, withCredentials });
  }

  public head<T>(endpoint: string, params?: HttpParams, headers?: HttpHeaders, withCredentials: boolean = false): Observable<T> {
    return this.http.head<T>(`${this.baseUrl}/${endpoint}`, { params, headers, withCredentials }).pipe(
      retry({ count: 1, delay: 0 }),
      catchError(this.handleError)
    );
  }
}