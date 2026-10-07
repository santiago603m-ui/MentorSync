import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR';

export interface CheckoutRespuesta {
  data: {
    redirectUrl?: string;
    checkoutId?: string;
    status?: string;
    referencia: string;
    modoSimulacion?: boolean;
    simuladorUrl?: string;
  };
}

export interface EstadoPagoRespuesta {
  data: {
    referencia: string;
    estado: EstadoPago;
    cursoId: string;
    inscripcionAplicada: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly apiUrl = 'http://localhost:4000/api/pagos';

  constructor(private http: HttpClient) {}

  crearCheckout(cursoId: string): Observable<CheckoutRespuesta> {
    return this.http.post<CheckoutRespuesta>(`${this.apiUrl}/checkout`, { cursoId });
  }

  abrirCheckout(url: string): void {
    if (typeof window === 'undefined') {
      throw new Error('El checkout solo puede abrirse desde el navegador');
    }
    window.location.assign(url);
  }

  simularPago(
    referencia: string,
    resultado: 'aprobado' | 'rechazado'
  ): Observable<{ data: { referencia: string; estado: EstadoPago; inscripcionAplicada: boolean } }> {
    return this.http.post<{
      data: { referencia: string; estado: EstadoPago; inscripcionAplicada: boolean };
    }>(`${this.apiUrl}/simular/${encodeURIComponent(referencia)}`, { resultado });
  }

  consultarEstado(referencia: string): Observable<EstadoPagoRespuesta> {
    return this.http.get<EstadoPagoRespuesta>(
      `${this.apiUrl}/estado/${encodeURIComponent(referencia)}`
    );
  }
}
