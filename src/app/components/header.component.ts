import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-header',
  standalone: true,
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule],
  template: `
    <div class="header">
      <h2>Panel {{ username || 'Invitado' }}</h2>
      <button (click)="logout()">Cerrar sesión</button>
    </div>
  `,
})
export class HeaderComponent implements OnInit {
  username: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload: any = jwtDecode(token);
          console.log('Payload del token:', payload);
          this.username = payload.username || '';
        } catch (error) {
          console.error('Token inválido:', error);
          this.username = '';
        }
      }
    } else {
      this.username = '';
      console.warn('No se accede a localStorage en servidor (SSR)');
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
}
