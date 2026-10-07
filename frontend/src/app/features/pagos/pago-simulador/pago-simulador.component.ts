import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoService } from '../../../core/services/pago.service';
import { GlassCardComponent } from '../../../shared/components/glass-card/glass-card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-pago-simulador',
  standalone: true,
  imports: [GlassCardComponent, ButtonComponent],
  template: `
    <main class="simulador-wrap">
      <app-glass-card label="pago simulado">
        <h2>Simulador de pagos</h2>
        <p class="texto">
          Modo de desarrollo local. No se realiza ningún cobro real. Elige el resultado
          que quieres simular para la referencia <strong>{{ referencia() }}</strong>.
        </p>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <div class="acciones">
          <app-button variant="primary" [disabled]="cargando()" (click)="simular('aprobado')">
            {{ cargando() ? 'Procesando…' : 'Simular pago aprobado' }}
          </app-button>
          <app-button variant="outline" [disabled]="cargando()" (click)="simular('rechazado')">
            Simular pago rechazado
          </app-button>
        </div>
      </app-glass-card>
    </main>
  `,
  styles: [`
    .simulador-wrap { min-height: 80vh; display: grid; place-items: center; padding: 2rem 1rem; }
    h2 { margin: 0 0 .75rem; color: var(--text-primary); }
    .texto { margin: 0 0 1.5rem; color: var(--text-secondary); line-height: 1.5; }
    .acciones { display: flex; gap: .75rem; flex-wrap: wrap; }
    .error { margin: 0 0 1rem; color: var(--danger); }
  `],
})
export class PagoSimuladorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pagoService = inject(PagoService);

  readonly referencia = signal('');
  readonly error = signal('');
  readonly cargando = signal(false);

  ngOnInit(): void {
    const referencia = this.route.snapshot.queryParamMap.get('ref');
    if (!referencia) {
      this.error.set('No se recibió la referencia del pago.');
      return;
    }
    this.referencia.set(referencia);
  }

  simular(resultado: 'aprobado' | 'rechazado'): void {
    const referencia = this.referencia();
    if (!referencia || this.cargando()) return;

    this.cargando.set(true);
    this.error.set('');

    this.pagoService.simularPago(referencia, resultado).subscribe({
      next: () => {
        this.router.navigate(['/pago/resultado'], { queryParams: { ref: referencia } });
      },
      error: (error: unknown) => {
        const apiError = error as { error?: { message?: string; error?: { message?: string } } };
        this.error.set(
          apiError.error?.error?.message || apiError.error?.message || 'No se pudo simular el pago.'
        );
        this.cargando.set(false);
      },
    });
  }
}