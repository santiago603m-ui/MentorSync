import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoService } from '../../../core/services/pago.service';
import { GlassCardComponent } from '../../../shared/components/glass-card/glass-card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

type VistaPago = 'verificando' | 'aprobado' | 'pendiente' | 'fallido' | 'error';

@Component({
  selector: 'app-pago-resultado',
  standalone: true,
  imports: [GlassCardComponent, ButtonComponent],
  template: `
    <main class="resultado-wrap">
      <app-glass-card label="pago">
        @switch (vista()) {
          @case ('verificando') {
            <h2>Confirmando tu pago…</h2>
            <p>Estamos esperando la confirmación segura de Mercado Pago.</p>
          }
          @case ('aprobado') {
            <h2 class="ok">¡Pago aprobado!</h2>
            <p>Ya quedaste inscrito en el curso.</p>
            <app-button variant="primary" (click)="irAMisCursos()">Ir a mis cursos</app-button>
          }
          @case ('pendiente') {
            <h2 class="aviso">Tu pago sigue en proceso</h2>
            <p>La confirmación aún no ha llegado. Puedes cerrar esta página.</p>
            <app-button variant="outline" (click)="irAMisCursos()">Volver a los cursos</app-button>
          }
          @case ('fallido') {
            <h2 class="fallo">El pago no se completó</h2>
            <p>La transacción fue rechazada, expiró o fue cancelada.</p>
            <app-button variant="primary" (click)="irAMisCursos()">Volver a los cursos</app-button>
          }
          @case ('error') {
            <h2 class="fallo">No pudimos verificar tu pago</h2>
            <p>{{ mensaje() }}</p>
            <app-button variant="outline" (click)="irAMisCursos()">Volver a los cursos</app-button>
          }
        }
      </app-glass-card>
    </main>
  `,
  styles: [`
    .resultado-wrap { min-height: 80vh; display: grid; place-items: center; padding: 2rem 1rem; }
    h2 { margin: 0 0 .75rem; color: var(--text-primary); }
    p { margin: 0 0 1.5rem; color: var(--text-secondary); line-height: 1.5; }
    .ok { color: var(--success); }
    .aviso { color: var(--warning); }
    .fallo { color: var(--danger); }
  `],
})
export class PagoResultadoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pagoService = inject(PagoService);

  readonly vista = signal<VistaPago>('verificando');
  readonly mensaje = signal('');

  private intentos = 0;
  private temporizador?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const referencia = this.route.snapshot.queryParamMap.get('ref');
    if (!referencia) {
      this.vista.set('error');
      this.mensaje.set('No recibimos la referencia del pago.');
      return;
    }
    this.verificar(referencia);
  }

  private verificar(referencia: string): void {
    this.pagoService.consultarEstado(referencia).subscribe({
      next: ({ data }) => {
        if (data.estado === 'APROBADO') {
          this.vista.set('aprobado');
        } else if (data.estado === 'PENDIENTE') {
          this.reintentar(referencia);
        } else {
          this.vista.set('fallido');
        }
      },
      error: (error: unknown) => {
        this.vista.set('error');
        const apiError = error as { error?: { error?: { message?: string } } };
        this.mensaje.set(apiError.error?.error?.message || 'Ocurrió un problema al consultar el pago.');
      },
    });
  }

  private reintentar(referencia: string): void {
    this.intentos += 1;
    if (this.intentos >= 20) {
      this.vista.set('pendiente');
      return;
    }
    this.temporizador = setTimeout(() => this.verificar(referencia), 3000);
  }

  irAMisCursos(): void {
    this.router.navigate(['/aprendiz']);
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }
}
