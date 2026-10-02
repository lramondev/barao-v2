import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public apiUrl: string = environment.api_url;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: HttpParams | { [param: string]: string | number | boolean | readonly (string | number | boolean)[] }): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { params });
  }

  post<T>(path: string, body: any = {}, params?: HttpParams): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body, { params });
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body);
  }

  delete<T>(path: string, body: any = {}): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`, { body });
  }
}
