import { Component, OnInit } from '@angular/core';
import { Reserva } from '../../models/lista-reservas.models';
import { Cancha } from '../../models/lista-canchas.models'; // Importamos el modelo Cancha
import { ReservaService } from '../../services/reserva.service';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service.js';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ventana-mis-reservas',
  standalone: true,
  providers: [ApiService],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
  ],
  templateUrl: './ventana-mis-reservas.component.html',
  styleUrl: './ventana-mis-reservas.component.css',
})
export class VentanaMisReservasComponent implements OnInit {
  lista_reservas: Reserva[] = [];
  lista_canchas: Cancha[] = []; // Nueva lista para mapear tipos
  email: string = '';
  emailEncontrado: boolean = true;
  mostrarMensajeExito: boolean = false;
  ordenAscendente: boolean = false;
  idReservaAEliminar: number | null = null;
  loading: boolean = true; 

  constructor(
    private reservaService: ReservaService,
    private apiService: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // 1. Cargar datos de canchas para tener los tipos (F5/F7)
    this.cargarDatosCanchas();

    // 2. Cargar usuario y reservas
    const personaGuardada = localStorage.getItem('usuarioLogueado');
    if (personaGuardada) {
      const usuario = JSON.parse(personaGuardada);
      this.email = usuario.email;
      this.buscarReservas();
    } else {
      this.loading = false;
    }

    this.reservaService.reservas$.subscribe((reservas) => {
      this.lista_reservas = reservas;
    });
  }

  cargarDatosCanchas(): void {
    this.apiService.getCanchas().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.lista_canchas = res.data;
        }
      },
      error: (err) => console.error('Error al cargar canchas', err)
    });
  }

  // Helper para mostrar el tipo en el HTML
  obtenerTipoCancha(idCancha: number): string {
    const cancha = this.lista_canchas.find(c => c.id === idCancha);
    return cancha ? cancha.tipoCancha : '-';
  }

  buscarReservas(): void {
    this.loading = true;
    if (this.email) {
      this.apiService.getReserva(this.email).subscribe({
        next: (response: any) => {
          if (response.data) {
            if (Array.isArray(response.data)) {
              this.lista_reservas = response.data;
            } else {
              this.lista_reservas = [response.data];
            }
          } else {
            this.lista_reservas = [];
          }

          // Ordenar descendente por defecto
          this.lista_reservas.sort((a, b) => {
             return new Date(b.fechaReserva).getTime() - new Date(a.fechaReserva).getTime();
          });

          this.emailEncontrado = this.lista_reservas.length > 0;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al buscar reservas:', err);
          this.emailEncontrado = false;
          this.lista_reservas = [];
          this.loading = false;
        },
      });
    }
  }

  alternarOrden(): void {
    this.ordenAscendente = !this.ordenAscendente;
    this.ordenarLista();
  }

  ordenarLista(): void {
    if (!this.lista_reservas) return;

    this.lista_reservas.sort((a, b) => {
      const fechaA = new Date(`${a.fechaReserva}T${a.horaInicio}`).getTime();
      const fechaB = new Date(`${b.fechaReserva}T${b.horaInicio}`).getTime();
      return this.ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
    });
  }

  getDia(fecha: string): string {
    return fecha.split('-')[2];
  }

  getMesCorto(fecha: string): string {
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const mesIndex = parseInt(fecha.split('-')[1]) - 1;
    return meses[mesIndex] || '';
  }

  abrirModalCancelacion(id: number): void {
    this.idReservaAEliminar = id;
  }

  cerrarModal(): void {
    this.idReservaAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (this.idReservaAEliminar !== null) {
      const id = this.idReservaAEliminar;
      const reserva = this.lista_reservas.find((r) => r.id === id);
      
      if (reserva) {
        this.apiService.updateCanchaStatus(reserva.idCancha, 'disponible').subscribe({
          next: () => {
            this.apiService.deleteReserva(id).subscribe({
              next: () => {
                this.mostrarMensajeExito = true;
                this.buscarReservas();
                this.cerrarModal();
                setTimeout(() => { this.mostrarMensajeExito = false; }, 3000);
              },
              error: (error) => console.error('Error al eliminar:', error),
            });
          },
          error: (error) => console.error('Error al actualizar cancha:', error),
        });
      }
    }
  }

  esCancelable(fecha: string): boolean {
    const [year, month, day] = fecha.split('-').map(num => parseInt(num, 10));
    const fechaReserva = new Date(year, month - 1, day); 
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaReserva.getTime() >= hoy.getTime();
  }

  volver(): void {
    this.location.back();
  }
}