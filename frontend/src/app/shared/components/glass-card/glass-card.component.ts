import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tarjeta base del sistema: se presenta como una "ventana de sesión"
 * (header con indicadores + etiqueta) en vez de un panel glassmorphism.
 * Este es el elemento visual que conecta hero, cursos y auth entre sí.
 */
@Component({
  selector: 'app-glass-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-card" [class.no-header]="!label">
      <div class="session-header" *ngIf="label">
        <span class="dot dot-a"></span>
        <span class="dot dot-b"></span>
        <span class="dot dot-c"></span>
        <span class="session-label">{{ label }}</span>
      </div>
      <div class="session-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .session-card {
      background: var(--surface-2);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      width: 100%;
      max-width: 400px;
      overflow: hidden;
    }
    .session-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.7rem 1rem;
      background: var(--surface-1);
      border-bottom: 1px solid var(--border-subtle);
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-a { background: var(--accent-violet); }
    .dot-b { background: var(--accent-cyan); }
    .dot-c { background: var(--text-muted); }
    .session-label {
      margin-left: 0.4rem;
      font-size: 0.78rem;
      color: var(--text-muted);
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    }
    .session-body { padding: 2rem; color: var(--text-primary); }
    .no-header .session-body { padding: 2rem; }
  `]
})
export class GlassCardComponent {
  @Input() label: string = '';
}
