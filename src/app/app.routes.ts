import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'admin', canActivate: [AuthGuard], loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'delivery', canActivate: [AuthGuard], loadComponent: () => import('./pages/delivery/delivery.component').then(m => m.DeliveryComponent) },
  { path: '**', redirectTo: 'login' },
];
