import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR';

export interface CheckoutRespuesta {
  data: { accion: string; campos: Record<string, string>; referencia: string };
}

export interface EstadoPagoRespuesta {
  data: { referencia: string; estado: EstadoPago; cursoId: string };
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = 'http://localhost:4000/api/pagos'; // mismo patrón que CursoService/AuthService

  constructor(private http: HttpClient) {}

  // 🔹 Crea el intento de pago. PayU no usa una URL de redirección simple: hay que
  //    enviar un FORMULARIO por POST con los campos que devuelve el backend.
  crearCheckout(cursoId: string): Observable<CheckoutRespuesta> {
    return this.http.post<CheckoutRespuesta>(`${this.apiUrl}/checkout`, { cursoId });
  }

  // 🔹 Construye un <form> invisible con los campos recibidos y lo envía por POST a PayU.
  //    Esto reemplaza a "window.location.href = url" que se usaba con Wompi.
  redirigirAPayU(accion: string, campos: Record<string, string>): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = accion;

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

  // 🔹 Al volver de PayU (?ref=...), consultamos el estado guardado en NUESTRA base de
  //    datos — la página de respuesta de PayU no es confiable, así que no se usa aquí.
  consultarEstado(referencia: string): Observable<EstadoPagoRespuesta> {
    return this.http.get<EstadoPagoRespuesta>(`${this.apiUrl}/estado/${encodeURIComponent(referencia)}`);
  }
}