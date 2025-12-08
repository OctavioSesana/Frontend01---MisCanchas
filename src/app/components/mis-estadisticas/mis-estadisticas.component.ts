import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ventana-mi-cuenta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-estadisticas.component.html',
  styleUrls: ['./mis-estadisticas.component.css']
})
export class VentanaMisEstadisticasComponent implements OnInit {
  
  usuarioId: number | null = null;
  loading: boolean = true;
  
  reporte = {
    totalReservas: 0,
    diaFavorito: '—',
    canchasStats: [] as { nombre: string, porcentaje: number }[]
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.obtenerIdDesdeToken();

    if (this.usuarioId) {
      this.cargarReporte();
    } else {
      // 🛑 SI NO HAY ID: Cortamos la carga acá para mostrar el cartel de login
      console.warn('Usuario no identificado. Mostrando pantalla de login.');
      this.loading = false;
    }
  }

  obtenerIdDesdeToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadDecoded = atob(payloadBase64);
        const datosUsuario = JSON.parse(payloadDecoded);
        this.usuarioId = Number(datosUsuario.id);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        this.usuarioId = null;
      }
    } else {
      this.usuarioId = null;
    }
  }

  cargarReporte() {
    this.loading = true;
    if (!this.usuarioId) return;

    this.apiService.getReporteUsuario(this.usuarioId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.reporte = {
            totalReservas: response.data.totalReservas,
            diaFavorito: response.data.diaFavorito,
            canchasStats: response.data.canchaFavorita || []
          };
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener estadísticas:', err);
        this.loading = false;
      }
    });
  }
}