import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR';

export interface CheckoutRespuesta {
  data: {
    accion: string;
    campos: Record<string, string>;
    referencia: string;
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

  /**
   * PayU Web Checkout exige un formulario POST firmado; no admite redireccionar
   * a una URL simple. El backend devuelve la acción y todos los camposfirmados.
   */
  redirigirAPayU(accion: string, campos: Record<string, string>): void {
    if (typeof document === 'undefined') {
      throw new Error('El checkout solo puede enviarse desde el navegador');
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = accion;
    form.acceptCharset = 'UTF-8';
    form.autocomplete = 'off';

    for (const [nombre, valor] of Object.entries(campos)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = nombre;
      input.value = valor;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  consultarEstado(referencia: string): Observable<EstadoPagoRespuesta> {
    return this.http.get<EstadoPagoRespuesta>(
      `${this.apiUrl}/estado/${encodeURIComponent(referencia)}`
    );
  }
}
