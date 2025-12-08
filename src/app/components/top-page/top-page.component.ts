import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service'; // Importar servicio

@Component({
  selector: 'app-top-page',
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule,
  ],
  templateUrl: './top-page.component.html',
  styleUrl: './top-page.component.css',
})
export class TopPageComponent implements OnInit {
  usuarioLogueado: any = null;

  // Inyectamos el servicio en el constructor
  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // --- AQUÍ ESTÁ LA MAGIA ---
    // Nos suscribimos. Cada vez que alguien llame a 'actualizarUsuario' o 'logout'
    // en el servicio, este código se ejecuta automáticamente y actualiza la vista.
    this.apiService.usuarioActual$.subscribe(usuario => {
      this.usuarioLogueado = usuario;
      console.log('Header detectó cambio de usuario:', this.usuarioLogueado);
    });
  }

  cerrarSesion(): void {
    // Usamos el método del servicio que limpia todo y avisa
    this.apiService.logout();
    window.location.href = '/login'; 
  }
}