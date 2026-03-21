import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  get<T = any>(path: string) {
    return this.http.get<T>(`${this.baseUrl}${path}`);
  }

  post<T = any>(path: string, body: any, options?: object) {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, options as any);
  }

  put<T = any>(path: string, body: any, options?: object) {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, options as any);
  }

  delete<T = any>(path: string, options?: object) {
    return this.http.delete<T>(`${this.baseUrl}${path}`, options as any);
  }
  postWithOptions<T = any>(path: string, body: any, options: object) {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, options as any);
  }
}
