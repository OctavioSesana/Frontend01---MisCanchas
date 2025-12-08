import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { TopPageComponent } from './components/top-page/top-page.component.js';
import { CanchasComponent } from './components/canchas/canchas.component.js';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './components/footer/footer.component';
import { VentanaReservasComponent } from './components/ventana-reservas/ventana-reservas.component.js';
import { routes } from './app.routes.js';
import { VentanaHomeComponent } from './components/ventana-home/ventana-home.component.js';
import { ApiService } from './services/api.service.js';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [
    ApiService
  ],
  imports: [
    RouterOutlet,
    RouterModule,
    TopPageComponent,
    CommonModule,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'frontend';

  // Inyectamos el Router y lo ponemos 'public' para usarlo en el HTML
  constructor(public router: Router) {}

  // Esta función nos dice si estamos en la zona admin
  esRutaAdmin(): boolean {
    return this.router.url.includes('/admin');
  }
}
