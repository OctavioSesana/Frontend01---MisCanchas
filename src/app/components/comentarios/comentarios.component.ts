import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  providers: [ApiService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule, 
    HttpClientModule,
  ],
  templateUrl: './comentarios.component.html',
  styleUrls: ['./comentarios.component.css'],
})
export class ComentariosComponent implements OnInit {

  nuevoComentario = {
    nombre: '',
    mensaje: '',
    calificacion: 0
  };

  listaComentarios: any[] = [];
  usuarioConectado: boolean = false;
  mostrarMensajeExito: boolean = false;

  constructor(private location: Location) {}

  ngOnInit() {
    // 1. Verificar sesión
    const personaGuardada = localStorage.getItem('usuarioLogueado');
    if (personaGuardada) {
      const usuario = JSON.parse(personaGuardada);
      this.usuarioConectado = true;
      // Pre-llenar nombre
      this.nuevoComentario.nombre = usuario.name ? `${usuario.name} ${usuario.lastname || ''}` : '';
    } else {
      this.usuarioConectado = false;
    }

    // 2. Cargar historial
    const guardados = localStorage.getItem('comentarios');
    if (guardados) {
      this.listaComentarios = JSON.parse(guardados);
    }
  }

  setCalificacion(valor: number) {
    this.nuevoComentario.calificacion = valor;
  }

  // Generar iniciales para el avatar (Ej: "Lionel Messi" -> "LM")
  getInicial(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.split(' ');
    if (partes.length > 1) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre[0].toUpperCase();
  }

  volver(): void {
    this.location.back();
  }

  enviarComentario() {
    if (!this.nuevoComentario.mensaje || this.nuevoComentario.calificacion === 0) return;

    // Crear objeto con fecha (opcional, para uso futuro)
    const comentarioAGuardar = {
      ...this.nuevoComentario,
      fecha: new Date().toISOString()
    };

    this.listaComentarios.push(comentarioAGuardar);
    localStorage.setItem('comentarios', JSON.stringify(this.listaComentarios));

    this.mostrarMensajeExito = true;
    setTimeout(() => {
      this.mostrarMensajeExito = false;
    }, 3000);

    // Resetear formulario (manteniendo nombre)
    const nombreActual = this.nuevoComentario.nombre;
    this.nuevoComentario = {
      nombre: nombreActual,
      mensaje: '',
      calificacion: 0
    };
  }
}