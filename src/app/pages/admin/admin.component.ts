import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { io } from 'socket.io-client';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '../../components/header.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    ToastModule,
    HeaderComponent,
  ],
  providers: [MessageService],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  deliveries: any[] = [];
  selectedUserId: string | null = null;
  newPackageAddress: string = '';
  assignModalVisible: boolean = false;
  deliveryToAssign: string | null = null;

  private map: any;
  private socket = io('https://tracker-backend12-703248740621.northamerica-northeast2.run.app');
  private allPaths: { [userId: string]: [number, number][] } = {};
  private userColors: { [userId: string]: string } = {};
  private displayedMarker: any = null;
  private displayedPolyline: any = null;
  private colorPalette = ['red', 'blue', 'green', 'purple', 'orange', 'brown', 'teal', 'pink', 'cyan', 'black'];
  private colorIndex = 0;
  private L: any; // Leaflet se almacenará aquí después de la carga dinámica

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return; // Evita ejecutar en el servidor

    // Mostrar datos del usuario que inició sesión
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Usuario logueado (payload del token):', payload);
      } catch (err) {
        console.error('Error al decodificar token:', err);
      }
    } else {
      console.warn('No hay token en localStorage');
    }

    // Carga dinámica de Leaflet solo en el navegador
    try {
      const leaflet = await import('leaflet');
      this.L = leaflet.default || leaflet; // Soporta tanto ESM como CommonJS
      this.initMap();
      this.listenForLocations();
    } catch (err) {
      console.error('Error cargando Leaflet:', err);
    }
  }

  private initMap(): void {
    if (!isPlatformBrowser(this.platformId) || !this.L) return;

    this.map = this.L.map('map').setView([20.0, -100.0], 5);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private listenForLocations(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.socket.on('location-update', (data: { userId: string; latitude: number; longitude: number; username?: string; status?: string }) => {
      const { userId, latitude, longitude, username, status } = data;

      if (!this.userColors[userId]) {
        this.userColors[userId] = this.colorPalette[this.colorIndex % this.colorPalette.length];
        this.colorIndex++;
      }

      // Guarda las ubicaciones
      if (!this.allPaths[userId]) this.allPaths[userId] = [];
      this.allPaths[userId].push([latitude, longitude]);

      // Actualiza lista de deliveries
      const existingIndex = this.deliveries.findIndex((d) => d.userId === userId);
      const updatedData = {
        userId,
        username: username ?? `Delivery ${userId.slice(0, 4)}`,
        status: status ?? 'Activo',
        lat: latitude,
        lng: longitude,
      };

      if (existingIndex > -1) {
        this.deliveries[existingIndex] = updatedData;
      } else {
        this.deliveries.push(updatedData);
      }

      // Si el delivery está seleccionado, actualizar el mapa
      if (userId === this.selectedUserId) {
        this.updateDisplayedRoute(userId);
      }
    });
  }

  selectDelivery(userId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.selectedUserId = userId;
    this.updateDisplayedRoute(userId);
  }

  private updateDisplayedRoute(userId: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.L) return;

    if (this.displayedMarker) {
      this.map.removeLayer(this.displayedMarker);
      this.displayedMarker = null;
    }
    if (this.displayedPolyline) {
      this.map.removeLayer(this.displayedPolyline);
      this.displayedPolyline = null;
    }

    const path = this.allPaths[userId];
    if (!path || path.length === 0) return;

    const lastCoord = path[path.length - 1];
    this.displayedMarker = this.L.marker(lastCoord).addTo(this.map);
    this.displayedPolyline = this.L.polyline(path, { color: this.userColors[userId] || 'blue' }).addTo(this.map);
    this.map.setView(lastCoord, 15);
  }

  openAssignPackagesModal(deliveryId: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.deliveryToAssign = deliveryId;
    this.newPackageAddress = '';
    this.assignModalVisible = true;
  }

  assignPackage() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.deliveryToAssign || !this.newPackageAddress) return;

    const token = localStorage.getItem('token');
    console.log('Token enviado:', token);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    console.log('Headers enviados:', headers);

    // Crear paquete
    this.http
      .post(
        'https://tracker-backend12-703248740621.northamerica-northeast2.run.app/api/packages',
        { address: this.newPackageAddress, deliveryId: this.deliveryToAssign },
        { headers }
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Paquete creado exitosamente',
            detail: 'Paquete en tránsito',
          });
          this.assignModalVisible = false;
        },
        error: (err) => console.error('Error creando paquete:', err),
      });
  }
}