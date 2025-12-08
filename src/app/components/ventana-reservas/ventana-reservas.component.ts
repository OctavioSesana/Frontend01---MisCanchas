import { Component, OnInit } from '@angular/core';
import { CanchasComponent } from '../canchas/canchas.component.js';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service.js';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Cancha } from '../../models/lista-canchas.models.js';
import { CanchaService } from '../../services/cancha.service.js';
// import { IngresoReservaComponent } from '../ingreso-reserva/ingreso-reserva.component.js';

@Component({
  selector: 'app-ventana-reservas',
  standalone: true,
  providers: [ApiService],
  imports: [
    CanchasComponent,
    RouterModule, // Recordar agregar siempre!!
    CommonModule,
    HttpClientModule,
  ],
  templateUrl: './ventana-reservas.component.html',
  styleUrl: './ventana-reservas.component.css',
})
export class VentanaReservasComponent implements OnInit {
  // VARIABLES
  lista_canchas: Cancha[] = []; // arreglo de canchas
  router: any;

  constructor(
    private canchaService: CanchaService,
    private apiService: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.apiService.getCanchas().subscribe({
      next: (response) => {
        if (response && Array.isArray(response.data)) {
          // Verificar que la respuesta contiene la propiedad 'data' que es un arreglo
          this.canchaService.setCanchas(response.data); // Pasar el arreglo de canchas al servicio
          console.log('Canchas guardadas en el servicio:', response.data);
        } else {
          console.error(
            'Error: no se encontraron canchas o la propiedad "data" no es un arreglo',
            response
          );
        }
      },
      error: (error) => {
        console.error('Error al obtener las canchas:', error);
      },
    });
    // Obtener canchas desde el servicio
    this.canchaService.canchas$.subscribe((canchas) => {
      this.lista_canchas = canchas; // Actualiza lista_canchas con los datos del servicio
      console.log('reservas oninit');
    });
  }

  filtrarCanchas(tipo?: string): void {
    // Filtrar canchas usando el servicio
    this.lista_canchas = this.canchaService.getCanchas(tipo);
  }

  mostrarTodas(): void {
    this.lista_canchas = this.canchaService.getCanchas(); // Sin filtros
  }

  /* get hasCanchas(): boolean {
    return this.lista_canchas && this.lista_canchas.length > 0;
  } */

  trackByFn(_index: number, item: Cancha) {
    //solo se renderiza el elemento modificado
    return item.id;
  }

  seleccionarCancha(cancha: Cancha) {
    console.log('Cancha seleccionada:', cancha);
    // Aquí pon tu lógica original. 
    // Si antes guardabas en localStorage y navegabas, mantenlo:
    localStorage.setItem('canchaSeleccionada', JSON.stringify(cancha));
    this.router.navigate(['/ingreso-reserva']); // O la ruta que corresponda
  }

  volver(): void {
    this.location.back();
  }
}
