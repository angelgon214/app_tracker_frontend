import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { authInterceptor } from '../app/interceptors/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(), // 
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptors([authInterceptor]), 
      withFetch()                         
    ),
    providePrimeNG({
      theme: { preset: Aura },
    }),
    MessageService
  ],
};
