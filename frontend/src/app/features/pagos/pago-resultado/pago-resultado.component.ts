import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoService } from '../../../core/services/pago.service';
import { GlassCardComponent } from '../../../shared/components/glass-card/glass-card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { NavbarComponent } from '../../../layouts/navbar/navbar.component';

type Vista = 'verificando' | 'aprobado' | 'pendiente' | 'rechazado' | 'error';

/**
 * Página a la que PayU devuelve al aprendiz (responseUrl = /pago/resultado?ref=<referencia>).
 * OJO: aquí NO le preguntamos directamente a PayU — su respuesta de navegador no es confiable.
 * página de respuesta no es confiable. Consultamos el estado que YA tenemos guardado,
 * actualizado por la confirmación (webhook) que llega server-to-server.
 * Si el pago sigue PENDIENTE, reintenta cada 3 s durante ~1 minuto.
 */
@Component({
  selector: 'app-pago-resultado',
  standalone: true,
  imports: [GlassCardComponent, ButtonComponent, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="resultado-wrap">
      <app-glass-card label="pago">
        @switch (vista()) {
          @case ('verificando') {
            <h2>Confirmando tu pago…</h2>
            <p class="texto">Estamos verificando la transacción con PayU. No cierres esta ventana.</p>
          }
          @case ('aprobado') {
            <h2 class="ok">¡Pago aprobado!</h2>
            <p class="texto">Ya quedaste inscrito en el curso. Puedes empezar a aprender ahora mismo.</p>
            <app-button variant="primary" (click)="irAMisCursos()">Ir a mis cursos</app-button>
          }
          @case ('pendiente') {
            <h2 class="aviso">Tu pago sigue en proceso</h2>
            <p class="texto">
              Tu banco aún no confirma la transacción (esto es normal en PSE). Cuando se apruebe
              te inscribiremos automáticamente; puedes cerrar esta página.
            </p>
            <app-button variant="outline" (click)="irAMisCursos()">Volver a los cursos</app-button>
          }
          @case ('rechazado') {
            <h2 class="fallo">El pago no se completó</h2>
            <p class="texto">La transacción fue rechazada, expiró o fue cancelada. No se te cobró nada; puedes intentarlo de nuevo.</p>
            <app-button variant="primary" (click)="irAMisCursos()">Volver a los cursos</app-button>
          }
          @case ('error') {
            <h2 class="fallo">No pudimos verificar tu pago</h2>
            <p class="texto">{{ mensaje() }}</p>
            <app-button variant="outline" (click)="irAMisCursos()">Volver a los cursos</app-button>
          }
        }
      </app-glass-card>
    </main>
  `,
  styles: [`
    .resultado-wrap {
      min-height: 80vh;
      display: grid;
      place-items: center;
      padding: 2rem 1rem;
    }
    h2 { margin: 0 0 0.75rem; font-family: var(--font-display); color: var(--text-primary); }
    .texto { margin: 0 0 1.5rem; color: var(--text-secondary); line-height: 1.5; }
    .ok { color: var(--success); }
    .aviso { color: var(--warning); }
    .fallo { color: var(--danger); }
  `]
})
export class PagoResultadoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pagoService = inject(PagoService);

  vista = signal<Vista>('verificando');
  mensaje = signal('');

  private intentos = 0;
  private readonly maxIntentos = 20; // 20 × 3 s ≈ 1 minuto
  private readonly intervaloMs = 3000;
  private temporizador?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    const referencia = this.route.snapshot.queryParamMap.get('ref');
    if (!referencia) {
      this.vista.set('error');
      this.mensaje.set('No recibimos la referencia del pago.');
      return;
    }
    this.verificar(referencia);
  }

  private verificar(referencia: string) {
    this.pagoService.consultarEstado(referencia).subscribe({
      next: ({ data }) => {
        switch (data.estado) {
          case 'APROBADO':
            this.vista.set('aprobado');
            break;
          case 'PENDIENTE':
            this.reintentar(referencia);
            break;
          default: // RECHAZADO | ANULADO | ERROR
            this.vista.set('rechazado');
        }
      },
      error: (err) => {
        this.vista.set('error');
        this.mensaje.set(err?.error?.error?.message ?? 'Ocurrió un problema al consultar el pago.');
      }
    });
  }

  private reintentar(referencia: string) {
    this.intentos++;
    if (this.intentos >= this.maxIntentos) {
      this.vista.set('pendiente');
      return;
    }
    this.temporizador = setTimeout(() => this.verificar(referencia), this.intervaloMs);
  }

  irAMisCursos() {
    this.router.navigate(['/aprendiz']);
  }

  ngOnDestroy() {
    clearTimeout(this.temporizador);
  }
}