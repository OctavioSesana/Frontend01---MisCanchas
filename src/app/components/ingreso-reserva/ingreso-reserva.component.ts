import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importante para ngModel
import { RouterModule } from '@angular/router';
import { Reserva } from '../../models/lista-reservas.models';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-ingreso-reserva',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ingreso-reserva.component.html',
  styleUrls: ['./ingreso-reserva.component.css'],
})
export class IngresoReservaComponent implements OnInit {
  // Datos de la reserva
  reserva: Reserva = {
    id: 0,
    fechaReserva: '',
    horaInicio: '',
    horaFin: '',
    totalReserva: 0,
    mail_cliente: '',
    idCancha: 0,
    idEmpleado: 0,
  };

  // Estados de la vista
  reservaConfirmada: boolean = false;
  emailRegistrado: boolean = true;
  usuarioConectado: boolean = false;
  
  // Variables para lógica de fechas y turnos
  fechaMinima: string = ''; // <--- NUEVA VARIABLE
  turnosDisponibles: string[] = [];
  cargandoTurnos: boolean = false;
  turnoSeleccionado: string | null = null;

  // Horarios del club
  horariosClub: string[] = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', 
    '21:00', '22:00', '23:00'
  ];

  constructor(private apiService: ApiService, private location: Location) {}

  ngOnInit(): void {
    // 1. BLOQUEAR FECHAS PASADAS
    const hoy = new Date();
    // Formato YYYY-MM-DD para el input date
    this.fechaMinima = hoy.toISOString().split('T')[0]; 

    // 2. Cargar usuario
    const personaGuardada = localStorage.getItem('usuarioLogueado');
    if (personaGuardada) {
      const usuario = JSON.parse(personaGuardada);
      this.reserva.mail_cliente = usuario.email;
      this.usuarioConectado = true;
    } else {
      this.usuarioConectado = false;
    }

    // 3. Cargar Cancha
    const idCanchaSeleccionada = localStorage.getItem('idCancha');
    if (idCanchaSeleccionada) {
      this.reserva.idCancha = Number(idCanchaSeleccionada);
    }
  }

  // --- Lógica de Disponibilidad ---
  onFechaChange(): void {
    if (this.reserva.fechaReserva && this.reserva.idCancha) {
      this.cargarTurnosDisponibles();
    }
  }

  cargarTurnosDisponibles(): void {
    this.cargandoTurnos = true;
    this.turnosDisponibles = [];
    this.turnoSeleccionado = null; 

    this.apiService.getReservasByCanchaFecha(this.reserva.idCancha, this.reserva.fechaReserva)
      .subscribe({
        next: (reservasOcupadas: any[]) => {
          const horasOcupadas = reservasOcupadas.map(r => r.horaInicio);
          this.turnosDisponibles = this.horariosClub.filter(hora => !horasOcupadas.includes(hora));
          this.cargandoTurnos = false;
        },
        error: (err) => {
          console.error('Error al cargar turnos:', err);
          this.cargandoTurnos = false;
        }
      });
  }

  seleccionarTurno(hora: string): void {
    this.turnoSeleccionado = hora;
    this.reserva.horaInicio = hora;

    const [horasStr, minutosStr] = hora.split(':');
    let horaNum = parseInt(horasStr, 10);
    let nuevoHorario = horaNum + 1;
    
    if (nuevoHorario >= 24) nuevoHorario -= 24;
    const horaFinStr = nuevoHorario.toString().padStart(2, '0');
    
    this.reserva.horaFin = `${horaFinStr}:${minutosStr}`;
  }

  saveReserva(): void {
    if (!this.turnoSeleccionado) {
      alert('Por favor, elegí un turno disponible antes de confirmar.');
      return;
    }

    this.apiService.getCanchaById(this.reserva.idCancha).subscribe({
      next: (response) => {
        const canchaData = response.data || response; 
        
        if (canchaData && canchaData.precioHora) {
          this.reserva.totalReserva = canchaData.precioHora;

          this.apiService.getPersona(this.reserva.mail_cliente).subscribe({
            next: (persona) => {
              if (persona) {
                this.apiService.saveReserva(this.reserva).subscribe({
                  next: (resReserva) => {
                    this.reservaConfirmada = true;
                    if (this.turnoSeleccionado) {
                        this.turnosDisponibles = this.turnosDisponibles.filter(t => t !== this.turnoSeleccionado);
                        this.turnoSeleccionado = null; 
                    }
                    
                    const linkPago = resReserva.init_point;
                    if (linkPago) {
                      window.location.href = linkPago;
                    } else {
                      setTimeout(() => { window.location.href = '/'; }, 3000);
                    }
                  },
                  error: (err) => console.error('Error al guardar reserva:', err)
                });
              } else {
                this.emailRegistrado = false;
              }
            },
            error: (err) => {
              this.emailRegistrado = false;
            }
          });
        }
      },
      error: (err) => console.error('Error obteniendo datos de la cancha:', err)
    });
  }

  volver(): void {
    this.location.back();
  }
}