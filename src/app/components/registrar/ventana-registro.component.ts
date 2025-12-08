import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // <--- 1. Importar Router
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { Persona } from '../../models/lista-personas.models';
import { PersonaService } from '../../services/persona.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ventana-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
  ],
  templateUrl: './ventana-registro.component.html',
  styleUrl: './ventana-registro.component.css',
})
export class VentanaRegistroComponent implements OnInit {
  persona: Persona = {
    id: 0,
    name: '',
    lastname: '',
    dni: 0,
    email: '',
    phone: '',
    password: '',
  };

  registroConfirmado: boolean = false;
  usuarioRegistrado: boolean = false;
  esEmpleado: boolean = false;
  codigoAdmin: string = '';
  errorClaveIncorrecta: boolean = false;
  
  cargando: boolean = false;
  mostrarPassword: boolean = false;

  constructor(
    private personaService: PersonaService,
    private apiService: ApiService,
    private router: Router // <--- 2. Inyectar Router
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
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  private realizarRegistro() {
    // 1. LIMPIEZA Y CONVERSIÓN DE DATOS (Acá está la magia 🪄)
    const payload: any = {
        name: this.persona.name,
        lastname: this.persona.lastname,
        email: this.persona.email,
        password: this.persona.password,
        
        // 🚨 IMPORTANTE: Forzamos a que sea NÚMERO
        dni: Number(this.persona.dni), 
        
        // 🚨 IMPORTANTE: Forzamos a que sea TEXTO (Zod espera string en phone)
        phone: String(this.persona.phone) 
    };

    // Solo agregamos el codigoAdmin si realmente escribió algo y marcó el checkbox
    if (this.esEmpleado && this.codigoAdmin) {
        payload.codigoAdmin = this.codigoAdmin;
    }

    console.log('📦 Enviando Payload LIMPIO:', payload);

    this.apiService.savePersona(payload).subscribe({
      next: (response: any) => {
        // ... (el resto de tu código igual que antes) ...
        const usuarioReal = response.data || response.persona || response; // Aseguramos agarrar la data
        
        console.log('✅ Respuesta Exitosa:', response);
        if (response.token) {
            localStorage.setItem('token', response.token);
        }

        this.apiService.actualizarUsuario(usuarioReal);
        this.personaService.savePersona(usuarioReal);
        
        this.registroConfirmado = true;

        setTimeout(() => {
           // Chequeamos el rol que viene del back
           const rol = usuarioReal.rol || usuarioReal.role; 
           
           if (rol === 'admin') {
             this.router.navigate(['/admin']); 
           } else {
             if (this.esEmpleado) {
                alert('La clave era incorrecta. Se creó como Cliente.');
             }
             this.router.navigate(['/']); 
           }
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Error detallado:', err.error); // Mirá esto en consola si falla
        this.cargando = false; 

        if (err.status === 403) {
           this.errorClaveIncorrecta = true;
        } 
        else if (err.status === 400) {
            // Mostramos qué campo falló exactamente
            const msg = JSON.stringify(err.error.errors || err.error.message);
            alert('Datos inválidos: ' + msg);
        }
        else {
           alert('Ocurrió un error inesperado.');
        }
      }
    });
  }

  savePersona() {
    if (this.cargando) return;
    this.cargando = true;
    this.usuarioRegistrado = false;
    this.errorClaveIncorrecta = false;

    this.apiService.getPersona(this.persona.email).subscribe({
      next: (emailExists) => {
        if (emailExists) {
          this.usuarioRegistrado = true;
          this.cargando = false;
        } else {
          this.realizarRegistro();
        }
      },
      error: (error) => {
        console.warn('Usuario no encontrado (404), registrando nuevo...');
        this.realizarRegistro();
      }
    });
  }
}