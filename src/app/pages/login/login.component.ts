import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

login() {
  this.authService.login(this.username, this.password).subscribe({
    next: (response) => {
      const token = response.token;
      localStorage.setItem('token', token);

      localStorage.setItem('username', this.username);
      
      const payload = JSON.parse(atob(token.split('.')[1]));
localStorage.setItem('user', JSON.stringify({
  id: payload.id,
  username: payload.username
}));

localStorage.setItem('username', payload.username);
      this.messageService.add({
        severity: 'success',
        summary: 'Inicio de sesión exitoso',
        detail: `Entrando como ${this.username}`,
        life: 2000
      });

      // Guarda el nombre de usuario
      localStorage.setItem('username', payload.username);

      if (payload.role === 'admin') {
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 2000);
      } else if (payload.role === 'delivery') {
        setTimeout(() => {
          this.router.navigate(['/delivery']);
        }, 2000);
      }
    },
    error: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Credenciales inválidas'
      });
    }
  });
}
}
