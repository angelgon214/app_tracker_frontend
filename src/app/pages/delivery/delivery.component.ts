import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { HeaderComponent } from "../../components/header.component";

let L: any;

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss']
})
export class DeliveryComponent implements OnInit, OnDestroy {
  username: string = '';
  private intervalId: any;
  private socket: Socket;

  private map: any;
  private marker: any;
  private path: [number, number][] = [];
  private polyline: any;
  private customIcon: any;

  packages: {
    id: number;
    address: string;
    status: string;
  }[] = [];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.socket = io('http://localhost:3000');
  }

async ngOnInit() {
  if (!isPlatformBrowser(this.platformId)) return;

  this.username = localStorage.getItem('username') || '';

  const LModule = (await import('leaflet')).default;
  L = LModule;

  this.initMap();
  this.startSendingLocation();
  this.loadPackages();

  // Paquetes nuevos o actualizados vía socket
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;
  this.socket.on(`package-update-${userId}`, (pkg: any) => {
    const index = this.packages.findIndex(p => p.id === pkg.id);
    if (index > -1) {
      // Actualizar paquete existente
      this.packages[index] = { ...this.packages[index], ...pkg };
    } else {
      // Agregar nuevo paquete
      this.packages.push(pkg);
    }
    console.log('Paquete actualizado vía socket:', pkg);
  });
}


  ngOnDestroy() {
    clearInterval(this.intervalId);
    this.socket.disconnect();
  }

  initMap() {
    this.map = L.map('map').setView([20.5888, -100.3899], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.customIcon = L.icon({
      iconUrl: 'assets/marker.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      shadowUrl: '',
    });

    this.polyline = L.polyline([], { color: 'blue' }).addTo(this.map);

    console.log('Mapa inicializado:', this.map);
  }

  startSendingLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.updateMapPosition(latitude, longitude);

          this.intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                this.updateMapPosition(lat, lng);
                this.sendLocationToBackend(lat, lng);
                this.emitLocationViaSocket(lat, lng);
              },
              (error) => console.error('Error obteniendo ubicación:', error)
            );
          }, 10000);
        },
        (error) => {
          console.error('Error obteniendo ubicación inicial:', error);
        }
      );
    } else {
      console.warn('Geolocalización no soportada en navegador');
    }
  }

  updateMapPosition(lat: number, lng: number) {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: this.customIcon }).addTo(this.map);
    }

    this.path.push([lat, lng]);
    this.polyline.setLatLngs(this.path);
    this.map.setView([lat, lng]);
  }

  sendLocationToBackend(lat: number, lng: number) {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post('http://localhost:3000/api/locations', { lat, lng }, { headers }).subscribe({
      next: () => console.log('Ubicación enviada a backend:', lat, lng),
      error: err => console.error('Error enviando ubicación al backend:', err)
    });
  }

emitLocationViaSocket(lat: number, lng: number) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const username = user.username || 'Anónimo';
  const userId = user.id;

  this.socket.emit('location-update', {
    userId,
    username,
    latitude: lat,
    longitude: lng
  });
}

  
  loadPackages() {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{ id: number; address: string; status: string }[]>('http://localhost:3000/api/packages/my', { headers }).subscribe({
      next: (data) => {
        console.log('Paquetes cargados:', data);
        this.packages = data;
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
      }
    });
  }

  updatePackageStatus(pkgId: number, event: Event) {
    if (!isPlatformBrowser(this.platformId)) return;

    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value;

    const pkg = this.packages.find(p => p.id === pkgId);
    if (pkg) {
      pkg.status = newStatus;
      console.log(`Paquete ${pkgId} actualizado a estado: ${newStatus}`);

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      this.http.put('http://localhost:3000/api/packages/status', { packageId: pkgId, status: newStatus }, { headers }).subscribe({
        next: () => console.log('Estado actualizado en backend'),
        error: err => console.error('Error al actualizar estado en backend:', err)
      });
    }
  }
}
