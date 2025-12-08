import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
// import { HttpClientModule } from '@angular/common/http'; <--- ❌ BORRALO (Ya lo provees en main.ts)
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { Persona } from '../../models/lista-personas.models';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-ventana-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    // HttpClientModule, // <--- No hace falta acá si usas standalone
  ],
  templateUrl: './ventana-login.component.html',
  styleUrl: './ventana-login.component.css',
})
export class VentanaLoginComponent implements OnInit {
  persona: Persona = {
    id: 0,
    name: '',
    lastname: '',
    dni: 0,
    email: '',
    phone: '',
    password: '',
  };
  
  loginConfirmado: boolean = false;
  submitted: boolean = false;
  cargando: boolean = false;
  mostrarPassword: boolean = false;

  vistaRecuperar: boolean = false;
  emailRecuperacion: string = '';
  mailEnviado: boolean = false;
  mensajeErrorRecu: string = '';

  constructor(
    private apiService: ApiService,
    private personaService: PersonaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.persona = {
      id: 0,
      name: '',
      lastname: '',
      dni: 0,
      email: '',
      phone: '',
      password: '',
    };
    
    // Opcional: Limpiar token viejo al entrar al login
    localStorage.removeItem('token');
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  cambiarVista() {
    this.vistaRecuperar = !this.vistaRecuperar;
    this.mailEnviado = false; // Resetear mensaje
    this.mensajeErrorRecu = ''; // Limpiamos errores al cambiar vista
    this.emailRecuperacion = '';}

  enviarRecuperacion() {
    if (!this.emailRecuperacion) return;

    this.cargando = true;
    this.mensajeErrorRecu = ''; // Reseteamos mensaje de error
    this.mailEnviado = false;

    this.apiService.recuperarPassword(this.emailRecuperacion).subscribe({
      next: (res: any) => {
        console.log(res);
        this.mailEnviado = true; // Mostramos mensaje verde
        this.cargando = false;
        
        setTimeout(() => {
            this.cambiarVista();
            this.emailRecuperacion = '';
        }, 4000);
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        
        // 👇 ACÁ CAPTURAMOS EL ERROR DEL BACKEND
        if (err.status === 404) {
            this.mensajeErrorRecu = '❌ No existe ningún usuario con este correo electrónico.';
        } else {
            this.mensajeErrorRecu = '❌ Ocurrió un error. Intente nuevamente.';
        }
      }
    });
  }

  login(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.submitted = false;

    this.apiService.loginPersona(this.persona.email, this.persona.password).subscribe({
      next: (respuesta: any) => { // Le cambié el nombre a 'respuesta' para ser más claro
        console.log('✅ Login exitoso:', respuesta);
        
        // 🚨 PASO CRÍTICO: GUARDAR EL TOKEN 🚨
        if (respuesta.token) {
          localStorage.setItem('token', respuesta.token);
          console.log('🔑 Token guardado en LocalStorage');
        } else {
          console.warn('⚠️ OJO: El backend no devolvió un campo "token"');
        }

        // Manejo de datos de usuario
        // OJO: Depende de cómo responda tu backend. 
        // Si responde { token: "...", user: { ... } }, usá respuesta.user
        const usuarioData = respuesta.user || respuesta.data || respuesta;

        this.apiService.actualizarUsuario(usuarioData);
        this.personaService.savePersona(usuarioData);
        
        this.loginConfirmado = true;
        this.submitted = true;

        setTimeout(() => {
          // Chequeamos el rol en el objeto de usuario
          const rol = usuarioData.rol || usuarioData.role;

          if (rol === 'admin') {
            this.router.navigate(['/admin']); 
          } else {
            this.router.navigate(['/']); 
          }
          this.cargando = false; 
        }, 1000);
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.loginConfirmado = false;
        this.submitted = true;
        this.cargando = false;
      }
    });
  }
}