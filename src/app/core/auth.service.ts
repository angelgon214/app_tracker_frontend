import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'https://tracker-backend12-703248740621.northamerica-northeast2.run.app/api/auth';
  private tokenKey = 'tracker_token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${this.api}/login`, { username, password });
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  clear() {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
