export interface Persona {
  id?: number;
  name: string;      // Antes era nombre? Cambialo a name
  lastname: string;  // Antes era apellido? Cambialo a lastname
  dni: number;       // Ojo acá, tiene que ser number
  email: string;
  phone: string;
  password: string;
  // codigoAdmin?: string; // Opcional si lo usás en el front
}