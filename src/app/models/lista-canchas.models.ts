export interface Cancha {
        precioTemporal: number;
        editando: boolean;
        id: number,
        estado:string,
        precioHora: number,
        tipoCancha: string
    }

export interface CanchaResponse {
  precioHora: number;
  message: string;
  data: Cancha;
}