import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Cancha, CanchaResponse } from '../models/lista-canchas.models.js';
import { Reserva } from '../models/lista-reservas.models.js';
import { ReservaArticulo } from '../models/reserva-articulo.models.js';
import { Persona } from '../models/lista-personas.models.js';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = `http://localhost:3000/api`;
  private usuarioSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public usuarioActual$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getUserFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('usuarioLogueado');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  actualizarUsuario(usuario: any) {
    // Guardamos en disco
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
    // Avisamos a todos los componentes suscritos
    this.usuarioSubject.next(usuario); 
  }

  logout() {
    // Borramos del disco
    localStorage.removeItem('usuarioLogueado');
    // Avisamos que ahora es null
    this.usuarioSubject.next(null); 
  }

  getDashboardStats(): Observable<any> {
  return this.http.get(`${this.apiUrl}/reserva/dashboard/stats`);
}

  // Método para obtener canchas
  getCanchas(): Observable<any> {
    return this.http.get<Cancha[]>(`${this.apiUrl}/cancha`);
  }

  getCanchaById(id: number): Observable<CanchaResponse> {
    return this.http.get<CanchaResponse>(`${this.apiUrl}/cancha/${id}`);
  }

  // Metodo para obtener reservas
  getReservas(): Observable<any> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/reserva`);
  }

  // Metodo para guardar reservas
  saveReserva(reserva: Reserva): Observable<any> {
    return this.http.post<Reserva>(
      `${this.apiUrl}/reserva`,
      reserva
    );
  }

  getReservasByCanchaFecha(idCancha: number, fecha: string): Observable<any> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/reserva/cancha/${idCancha}/fecha/${fecha}`);
  }

  updateCanchaStatus(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cancha/${id}`, { estado });
  }

  // Metodo para cancelar reservas
  deleteReserva(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reserva/${id}`);
  }

  // Metodo para obtener todos los articulos
  getArticulos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/articulo`);
  }

  getCurrentReservaId(): number | null {
    const idReserva = localStorage.getItem('reservaId'); // Recupera el valor
    console.log('Valor crudo de reservaId desde localStorage:', idReserva);
    return idReserva && !isNaN(Number(idReserva)) ? Number(idReserva) : null;
    //return idReserva ? Number(idReserva) : null; // Convierte a número solo si existe
  }

  reservarArticulo(reservaArticulo: ReservaArticulo) {
    return this.http.post(
      `${this.apiUrl}/reserva_articulo`,
      reservaArticulo
    );
  }

  updateArticuloStatus(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/articulo/${id}`, {
      estado,
    });
  }

  savePersona(data: any): Observable<any> {
  // Ahora 'data' va a ser un objeto que contiene { sanitizedInput: persona, codigoAdmin: '...' }
  return this.http.post(`${this.apiUrl}/persona`, data);
}

  // ver cómo buscar persona por mail y id
  getPersona(email: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/persona/${email}`);
  }

  loginPersona(email: string, password: string): Observable<Persona> {
  return this.http.post<Persona>(`${this.apiUrl}/login`, {
    email,
    password,
  });
}

recuperarPassword(email: string) {
  return this.http.post(`${this.apiUrl}/login/forgot-password`, { email });
}

resetearPassword(token: string, newPassword: string) {
  return this.http.post(`${this.apiUrl}/login/reset-password`, { token, newPassword });
}

getReporteUsuario(idUsuario: number) {
  return this.http.get<any>(`${this.apiUrl}/persona/${idUsuario}/reporte`);
}

createCancha(cancha: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/cancha`, cancha);
}

updateCancha(id: number, datos: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/cancha/${id}`, datos);
}

getAllPersonas(): Observable<any> {
  return this.http.get(`${this.apiUrl}/persona`);
}

updatePersonaByEmail(email: string, persona: Persona): Observable<Persona> {
  const encodedEmail = encodeURIComponent(email);
  return this.http.put<Persona>(`${this.apiUrl}/persona/${encodedEmail}`, persona);
}

verificarCancha(idCancha: number): Observable<Cancha> {
    return this.http.get<Cancha>(`${this.apiUrl}/cancha/${idCancha}`);
}

  getReserva(email: string): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(
      `${this.apiUrl}/reserva/${email}`
    );
  }

  createReservaConPago(reserva: Reserva): Observable<any> {
    return this.http.post<Reserva>(
      `${this.apiUrl}/reserva`,
      reserva
    );
  }
}
