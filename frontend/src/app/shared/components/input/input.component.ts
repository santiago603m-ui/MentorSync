import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="field" *ngIf="label">
      <span class="field-label">{{ label }}</span>
      <input
        [attr.type]="type"
        [placeholder]="placeholder"
        [ngClass]="['input', state]"
      />
    </label>
    <input
      *ngIf="!label"
      [attr.type]="type"
      [placeholder]="placeholder"
      [ngClass]="['input', state]"
    />
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: 0.4rem; width: 100%; }
    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .input {
      width: 100%;
      padding: 0.75rem 0.9rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--surface-1);
      color: var(--text-primary);
      outline: none;
      font-size: 0.95rem;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .input::placeholder { color: var(--text-muted); }
    .input:focus {
      border-color: var(--accent-cyan);
      background: var(--surface-2);
    }
    .input.success { border-color: var(--success); }
    .input.error { border-color: var(--danger); }
  `]
})
export class InputComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() state: 'default' | 'success' | 'error' = 'default';
}
