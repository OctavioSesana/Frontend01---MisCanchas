import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Persona } from '../../models/lista-personas.models';
import { ApiService } from '../../services/api.service';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mi-cuenta.component.html',
  styleUrls: ['./mi-cuenta.component.css'],
})
export class VentanaMiCuentaComponent implements OnInit {
  persona: Persona = {
    id: 0,
    name: '',
    lastname: '',
    dni: 0,
    email: '',
    phone: '',
    password: '',
  };

  // reportes
  usuarioId: number = 1; // TODO: Obtener esto dinámicamente de tu AuthService o localStorage
  
  reporte = {
    totalReservas: 0,
    diaFavorito: 'Cargando...',
    canchasStats: [] as any[]
  };

  mostrarFormularioEdicion = false;
  actualizacionExitosa = false;
  loading = false;

  constructor(
    private apiService: ApiService,
    private personaService: PersonaService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {
    // 1. Intentar cargar desde el servicio (estado global)
    this.personaService.persona$.subscribe((persona) => {
      if (persona) {
        this.persona = { ...persona }; // Copia para no mutar directo
        this.cdr.detectChanges();
      } else {
        // 2. Fallback: Cargar desde localStorage si se recargó la página
        const personaGuardada = localStorage.getItem('usuarioLogueado');
        if (personaGuardada) {
          this.persona = JSON.parse(personaGuardada);
        }
      }
    });
  }

  cargarReporte() {
    this.apiService.getReporteUsuario(this.usuarioId).subscribe({
      next: (response) => {
        if(response && response.data) {
          this.reporte = {
            totalReservas: response.data.totalReservas,
            diaFavorito: response.data.diaFavorito,
            canchasStats: response.data.canchaFavorita
          };
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando reporte', err);
        this.reporte.diaFavorito = 'No disponible';
        this.loading = false;
      }
    });
  }

  // Helper para mostrar iniciales en el avatar
  getInitials(): string {
    const n = this.persona.name ? this.persona.name.charAt(0) : '';
    const l = this.persona.lastname ? this.persona.lastname.charAt(0) : '';
    return (n + l).toUpperCase();
  }

  irAModificar(): void {
    this.mostrarFormularioEdicion = true;
  }

  guardarCambios(): void {
    this.loading = true;
    const emailOriginal = this.persona.email;

    this.apiService.updatePersonaByEmail(emailOriginal, this.persona).subscribe({
      next: (response: any) => {
        console.log('✅ Persona actualizada:', response);
        
        // Actualizamos los datos locales
        const updatedPersona = response.data || this.persona;
        this.persona = updatedPersona;
        this.personaService.savePersona(updatedPersona); // Actualiza localStorage y Subject

        this.mostrarFormularioEdicion = false;
        this.actualizacionExitosa = true;
        this.loading = false;

        setTimeout(() => {
          this.actualizacionExitosa = false;
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al actualizar:', error);
        alert('Ocurrió un error al intentar actualizar tus datos.');
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.location.back();
  }
}