import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service.js';
import { HttpClientModule } from '@angular/common/http';
import { Cancha } from '../../models/lista-canchas.models.js';
import { CanchaService } from '../../services/cancha.service.js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-canchas',
  standalone: true,
  providers: [ApiService],
  imports: [
    CommonModule,
    RouterModule, // Recordar agregar siempre!!
    HttpClientModule,
  ],
  templateUrl: './canchas.component.html',
  styleUrl: './canchas.component.css',
})
export class CanchasComponent implements OnInit {
  @Input() canchas: Cancha[] = []; //Recibe el array de canchas
  mostrarInfo = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Canchas en el hijo:', this.canchas);
  }

  canchaSeleccionada: Cancha | null = null;

  mostrarDetalles(cancha: Cancha): void {
    if (this.canchaSeleccionada === cancha) {
      this.canchaSeleccionada = null; // Ocultar detalles si se hace clic de nuevo
    } else {
      this.canchaSeleccionada = cancha; // Mostrar detalles de la nueva cancha
    }
  }

  seleccionarCancha(cancha: Cancha) {
    console.log('Cancha seleccionada:', cancha);
    localStorage.setItem('idCancha', cancha.id.toString());
    if (cancha.id) {
        localStorage.setItem('idCancha', cancha.id.toString());
    }
    this.router.navigate(['/ingreso-reserva']); 
  }
}
