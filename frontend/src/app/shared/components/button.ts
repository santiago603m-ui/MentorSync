import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled"
      [ngClass]="['btn', variant, size]"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      white-space: nowrap;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn:active:not(:disabled) { transform: translateY(1px); }

    /* Tamaños */
    .md { padding: 0.7rem 1.4rem; font-size: 0.95rem; }
    .sm { padding: 0.5rem 1rem; font-size: 0.85rem; }
    .lg { padding: 0.9rem 1.8rem; font-size: 1rem; }

    /* Variantes */
    .primary {
      background: var(--accent-gradient);
      color: #08101c;
    }
    .primary:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(139, 107, 255, 0.35);
      transform: translateY(-1px);
    }

    .outline {
      background: transparent;
      border-color: var(--border-strong);
      color: var(--text-primary);
    }
    .outline:hover:not(:disabled) {
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }

    .ghost {
      background: transparent;
      color: var(--text-secondary);
    }
    .ghost:hover:not(:disabled) { color: var(--text-primary); }

    .danger {
      background: var(--danger);
      color: #2a0a0a;
    }
    .danger:hover:not(:disabled) { box-shadow: 0 6px 18px rgba(255, 107, 107, 0.35); }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}
