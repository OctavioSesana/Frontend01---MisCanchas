import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-ventana-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ventana-reset-password.component.html',
  styleUrls: ['./ventana-reset-password.component.css'] // Corregí styleUrl a styleUrls si te da error
})
export class VentanaResetPasswordComponent implements OnInit {
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  
  cargando: boolean = false;
  mensajeExito: boolean = false;
  mensajeError: string = '';

  mostrarPassword: boolean = false;

  constructor(
    private route: ActivatedRoute, // Para leer la URL
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. CAPTURAR EL TOKEN DE LA URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.mensajeError = 'Link inválido. No hay token.';
      }
    });
  }

  cambiarPassword() {
    if (this.password !== this.confirmPassword) {
      this.mensajeError = 'Las contraseñas no coinciden';
      return;
    }
    
    this.cargando = true;
    this.mensajeError = '';

    this.apiService.resetearPassword(this.token, this.password).subscribe({
      next: () => {
        this.mensajeExito = true;
        this.cargando = false;
        // Redirigir al login después de 3 segundos
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error.message || 'Error al restablecer';
      }
    });
  }
}