import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [attr.type]="type" [ngClass]="variant">
      {{ label }}
    </button>
  `,
  styles:[`
    button {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .primary { background-color: #007bff; color: black; }
    .success { background-color: #28a745; color: black; }
    .danger  { background-color: #dc3545; color: black; }
  `]
})
export class ButtonComponent {
  @Input() label: string = 'Botón';
  @Input() variant: 'primary' | 'success' | 'danger' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
}
