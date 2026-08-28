import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiResponse, LoginResponse, UserInfo } from '../models/auth.models';
import { ENVIRONMENT } from '../../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${ENVIRONMENT.apiBaseUrl}/auth`;
  
  public currentUser = signal<UserInfo | null>(this.getUserFromStorage());
  public token = signal<string | null>(localStorage.getItem('access_token'));

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            localStorage.setItem('access_token', res.data.accessToken);
            localStorage.setItem('user_info', JSON.stringify(res.data.user));
            this.token.set(res.data.accessToken);
            this.currentUser.set(res.data.user);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'SuperAdmin' || user.role === 'CentralAdmin') return true;
    return user.permissions.includes(permissionCode);
  }

  private getUserFromStorage(): UserInfo | null {
    const data = localStorage.getItem('user_info');
    return data ? JSON.parse(data) : null;
  }
}
