import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service'; 
import { Reserva } from '../../models/lista-reservas.models'; 
// Nota: No importa si importas Cancha o no, usaremos 'any' para la lista de canchas.
import { FormsModule } from '@angular/forms';

// Interfaz simple para los datos del gráfico
interface DatoGrafico {
  label: string;
  valor: number;
  porcentaje: number;
  color: string;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.css'
})
export class PanelAdminComponent implements OnInit {

  usuarioAdmin: any = null;
  seccionActual: string = 'dashboard';
  idReservaAEliminar: number | null = null;

  reservasDeHoy: Reserva[] = [];
  cargandoDashboard: boolean = true;

  // Datos para Gráficos
  graficoMes: DatoGrafico[] = [];
  graficoHistorico: DatoGrafico[] = [];
  gradientMes: string = '';     
  gradientHistorico: string = '';
  fechaHoyCorta: string = '';

  // Paleta de colores para las canchas (Azules y Verdes para mantener estética)
  coloresGrafico = ['#0f172a', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
  
  // Variables para Reservas
  listaTodasReservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = []; // Agregamos esta para el filtro
  cargandoReservas: boolean = false;

  // Variables para Filtros de Reserva
  filtroEmail: string = '';
  filtroCancha: string = 'todas';
  ordenAscendente: boolean = false;

  // Variables para Canchas (Usamos ANY para evitar errores de 'editando')
  listaCanchas: any[] = []; 
  canchasFiltradas: any[] = [];
  cargandoCanchas: boolean = false;
  filtroTipoCancha: string = 'todas';

  // VARIABLES PARA EL MODAL DE ESTADO
  canchaSeleccionada: any = null; // La cancha que vamos a modificar

  // VARIABLES PARA MENSAJE DE ÉXITO (TOAST)
  mostrarMensajeExito: boolean = false;
  textoMensajeExito: string = '';

  // VARIABLES PARA CREAR CANCHA
  mostrarModalCreacion: boolean = false;
  nuevaCancha = {
    tipoCancha: 'futbol 5', // Valor por defecto
    precioHora: 0,
    estado: 'disponible'
  };

  fechaHoy: string = '';
  
  stats = {
    reservasHoy: 0,
    totalUsuarios: 0,
    canchasActivas: 0,
    recaudacionMes: 0
  };

  // Variables Usuarios
  listaUsuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  cargandoUsuarios: boolean = false;
  filtroUsuarioInput: string = '';

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // 1. Configurar fechas
    const hoy = new Date();
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.fechaHoy = hoy.toLocaleDateString('es-ES', opciones);
    this.fechaHoy = this.fechaHoy.charAt(0).toUpperCase() + this.fechaHoy.slice(1);

    // Formato YYYY-MM-DD para comparar con string de reservas
    this.fechaHoyCorta = hoy.toISOString().split('T')[0];

    // Usuario
    const data = localStorage.getItem('usuarioLogueado');
    if (data) {
      this.usuarioAdmin = JSON.parse(data);
      if (this.usuarioAdmin.rol !== 'admin') {
        this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/login']);
    }
    // 3. Cargar Datos Iniciales
    this.cargarDatosDashboard();
  }

  // --- LÓGICA PRINCIPAL DEL DASHBOARD ---
  cargarDatosDashboard() {
    this.cargandoDashboard = true;
    
    // Traemos TODAS las reservas para procesar los gráficos localmente
    this.apiService.getReservas().subscribe({
      next: (response: any) => {
        const todas = response.data || response;
        this.listaTodasReservas = todas; // Guardamos para usar en la pestaña Reservas también
        
        // A. Filtrar Reservas de HOY
        this.reservasDeHoy = todas.filter((r: Reserva) => r.fechaReserva === this.fechaHoyCorta);
        
        // B. Calcular Estadísticas Rápidas
        this.stats.reservasHoy = this.reservasDeHoy.length;
        
        // C. Generar Gráficos
        this.generarGraficos(todas);

        this.cargandoDashboard = false;
      },
      error: (err) => {
        console.error(err);
        this.cargandoDashboard = false;
      }
    });
  // Cargar stats simples (usuarios, canchas activas, recaudación)
    this.apiService.getDashboardStats().subscribe((data: any) => {
        this.stats.totalUsuarios = data.totalUsuarios;
        this.stats.canchasActivas = data.canchasActivas;
        this.stats.recaudacionMes = data.recaudacionMes;
    });
  }

  generarGraficos(reservas: Reserva[]) {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1; // 1-12
    const anioActual = fechaActual.getFullYear();

    // 1. Filtrar reservas del mes actual
    const reservasMes = reservas.filter(r => {
      const fechaRes = new Date(r.fechaReserva + 'T00:00:00'); // Fix zona horaria simple
      return (fechaRes.getMonth() + 1) === mesActual && fechaRes.getFullYear() === anioActual;
    });

    // 2. Procesar datos (Agrupar por ID Cancha)
    this.graficoMes = this.calcularDistribucionCanchas(reservasMes);
    this.graficoHistorico = this.calcularDistribucionCanchas(reservas);

    // 3. Generar Strings CSS para Conic Gradient
    this.gradientMes = this.construirGradient(this.graficoMes);
    this.gradientHistorico = this.construirGradient(this.graficoHistorico);
  }

  calcularDistribucionCanchas(lista: Reserva[]): DatoGrafico[] {
    const total = lista.length;
    if (total === 0) return [];

    const conteo: { [key: number]: number } = {};
    
    // Contar
    lista.forEach(r => {
      conteo[r.idCancha] = (conteo[r.idCancha] || 0) + 1;
    });

    // Convertir a array de objetos
    const resultado: DatoGrafico[] = Object.keys(conteo).map((idCancha, index) => {
      const cantidad = conteo[Number(idCancha)];
      return {
        label: `Cancha ${idCancha}`,
        valor: cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
        color: this.coloresGrafico[index % this.coloresGrafico.length] // Color cíclico
      };
    });

    // Ordenar por cancha
    return resultado.sort((a, b) => a.label.localeCompare(b.label));
  }

  construirGradient(datos: DatoGrafico[]): string {
    if (datos.length === 0) return 'conic-gradient(#e2e8f0 0% 100%)'; // Gris si vacío

    let cssString = 'conic-gradient(';
    let acumulado = 0;

    datos.forEach((d, i) => {
      const inicio = acumulado;
      acumulado += d.porcentaje;
      // Ajuste final para cerrar círculo exacto en 100%
      const fin = i === datos.length - 1 ? 100 : acumulado;
      
      cssString += `${d.color} ${inicio}% ${fin}%, `;
    });

    // Quitar última coma y cerrar paréntesis
    return cssString.slice(0, -2) + ')';
  }

  // --- FUNCIÓN AUXILIAR: MOSTRAR ÉXITO ---
  mostrarExito(mensaje: string) {
    this.textoMensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    
    // Desaparece solo a los 3 segundos
    setTimeout(() => {
      this.mostrarMensajeExito = false;
    }, 3000);
  }

  // --- CREAR CANCHA (Modificada) ---
  guardarCancha() {
    if (this.nuevaCancha.precioHora <= 0) return;

    this.apiService.createCancha(this.nuevaCancha).subscribe({
      next: (res) => {
        // 1. Cerramos modal de creación
        this.cerrarModalCreacion();
        // 2. Recargamos tabla
        this.cargarCanchas(); 
        // 3. Mostramos cartel lindo (NO alert)
        this.mostrarExito('✅ Cancha creada exitosamente');
      },
      error: (err) => alert('Error al crear la cancha.') // Los errores graves sí pueden ir en alert o un toast rojo
    });
  }

  // --- CAMBIAR ESTADO (Paso 1: Abrir Modal) ---
  abrirModalEstado(cancha: any) {
    this.canchaSeleccionada = cancha;
  }

  // --- CAMBIAR ESTADO (Paso 2: Confirmar y Ejecutar) ---
  confirmarCambioEstado() {
    if (!this.canchaSeleccionada) return;

    const cancha = this.canchaSeleccionada;
    const nuevoEstado = cancha.estado === 'disponible' ? 'mantenimiento' : 'disponible';

    this.apiService.updateCancha(cancha.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        cancha.estado = nuevoEstado; // Actualizamos vista
        this.canchaSeleccionada = null; // Cerramos modal
        this.mostrarExito(`Estado actualizado a: ${nuevoEstado.toUpperCase()}`);
      },
      error: (err) => alert('Error al cambiar el estado')
    });
  }

  cancelarCambioEstado() {
    this.canchaSeleccionada = null;
  }

  // --- NAVEGACIÓN ---
  cambiarSeccion(seccion: string) {
    this.seccionActual = seccion;
    if (seccion === 'reservas') this.cargarTodasLasReservas();
    if (seccion === 'usuarios') this.cargarUsuarios();
    if (seccion === 'canchas') this.cargarCanchas();
  }

  cerrarSesion() {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }

  cargarEstadisticas() {
    this.apiService.getDashboardStats().subscribe({
      next: (data: any) => this.stats = data,
      error: (err) => console.error(err)
    });
  }

  // --- FUNCIONES PARA CREAR CANCHA ---

  abrirModalCreacion() {
    this.mostrarModalCreacion = true;
    // Reseteamos el formulario
    this.nuevaCancha = {
      tipoCancha: 'futbol 5',
      precioHora: 0,
      estado: 'disponible'
    };
  }

  cerrarModalCreacion() {
    this.mostrarModalCreacion = false;
  }

  // --- RESERVAS ---
  cargarTodasLasReservas() {
    this.cargandoReservas = true;
    this.apiService.getReservas().subscribe({
      next: (response: any) => {
        this.listaTodasReservas = response.data || response;
        this.aplicarFiltros(); // Aplicar filtros iniciales
        this.cargandoReservas = false;
      },
      error: (err) => {
        console.error(err);
        this.cargandoReservas = false;
      }
    });
  }

  aplicarFiltros() {
    let resultado = [...this.listaTodasReservas];

    if (this.filtroEmail.trim() !== '') {
      const termino = this.filtroEmail.toLowerCase();
      resultado = resultado.filter(r => r.mail_cliente.toLowerCase().includes(termino));
    }

    if (this.filtroCancha !== 'todas') {
      const numeroCancha = Number(this.filtroCancha);
      resultado = resultado.filter(r => r.idCancha === numeroCancha);
    }

    resultado.sort((a, b) => {
      const fechaA = new Date(a.fechaReserva).getTime();
      const fechaB = new Date(b.fechaReserva).getTime();
      return this.ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
    });

    this.reservasFiltradas = resultado;
  }

  alternarOrden() {
    this.ordenAscendente = !this.ordenAscendente;
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.filtroEmail = '';
    this.filtroCancha = 'todas';
    this.aplicarFiltros();
  }

  esCancelable(fecha: string): boolean {
    const fechaReserva = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaReserva.getTime() >= hoy.getTime();
  }

  // Modal Reservas
  abrirModalCancelacion(id: number): void {
    this.idReservaAEliminar = id;
  }

  cerrarModal(): void {
    this.idReservaAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (this.idReservaAEliminar !== null) {
      const id = this.idReservaAEliminar;
      this.apiService.deleteReserva(id).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarTodasLasReservas();
        },
        error: (err) => {
          console.error(err);
          this.cerrarModal();
          alert('Error al eliminar reserva');
        }
      });
    }
  }

  // --- USUARIOS ---
  cargarUsuarios() {
    this.cargandoUsuarios = true;
    this.apiService.getAllPersonas().subscribe({
      next: (response: any) => {
        const todos = response.data || response;
        this.listaUsuarios = todos.filter((p: any) => p.rol !== 'admin');
        this.aplicarFiltroUsuarios();
        this.cargandoUsuarios = false;
      },
      error: (err) => {
        console.error(err);
        this.cargandoUsuarios = false;
      }
    });
  }

  aplicarFiltroUsuarios() {
    const termino = this.filtroUsuarioInput.toLowerCase().trim();
    if (termino === '') {
      this.usuariosFiltrados = [...this.listaUsuarios];
    } else {
      this.usuariosFiltrados = this.listaUsuarios.filter(u => 
        u.name.toLowerCase().includes(termino) || 
        u.lastname.toLowerCase().includes(termino) || 
        u.email.toLowerCase().includes(termino)
      );
    }
  }

  // --- CANCHAS (GESTIÓN DE ESTADO Y PRECIO) ---
  cargarCanchas() {
    this.cargandoCanchas = true;
    this.apiService.getCanchas().subscribe({
      next: (response: any) => {
        this.listaCanchas = response.data || response;
        
        // Inicializamos las propiedades de edición
        // IMPORTANTE: Especificamos (c: any) para que TS no se queje
        this.listaCanchas.forEach((c: any) => {
          c.editando = false;
          c.precioTemporal = c.precioHora;
        });

        this.listaCanchas.sort((a, b) => a.id - b.id);
        this.aplicarFiltroCanchas();
        this.cargandoCanchas = false;
      },
      error: (err) => {
        console.error(err);
        this.cargandoCanchas = false;
      }
    });
  }

  aplicarFiltroCanchas() {
    if (this.filtroTipoCancha === 'todas') {
      this.canchasFiltradas = [...this.listaCanchas];
    } else {
      this.canchasFiltradas = this.listaCanchas.filter(c => 
        c.tipoCancha.toLowerCase().includes(this.filtroTipoCancha)
      );
    }
  }

  activarEdicion(cancha: any) {
    cancha.editando = true;
    cancha.precioTemporal = cancha.precioHora;
  }

  cancelarEdicion(cancha: any) {
    cancha.editando = false;
  }

  guardarPrecio(cancha: any) {
    if (!cancha.precioTemporal || cancha.precioTemporal < 0) return;

    this.apiService.updateCancha(cancha.id, { precioHora: cancha.precioTemporal }).subscribe({
      next: () => {
        cancha.precioHora = cancha.precioTemporal;
        cancha.editando = false;
      },
      error: (err) => alert('Error al actualizar el precio')
    });
  }

  alternarEstadoCancha(cancha: any) {
    const nuevoEstado = cancha.estado === 'disponible' ? 'mantenimiento' : 'disponible';
    const mensaje = nuevoEstado === 'mantenimiento' 
      ? `¿Poner la Cancha ${cancha.id} en Mantenimiento?`
      : `¿Habilitar la Cancha ${cancha.id}?`;

    if (confirm(mensaje)) {
      this.apiService.updateCancha(cancha.id, { estado: nuevoEstado }).subscribe({
        next: () => cancha.estado = nuevoEstado,
        error: (err) => alert('Error al cambiar el estado')
      });
    }
  }
}