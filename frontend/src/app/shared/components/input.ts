import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input [attr.type]="type" [placeholder]="placeholder" [ngClass]="variant" />
  `,
  styles: [`
    input {
      padding: 0.5rem;
      border-radius: 8px solid #e80303;
      border: 1px solid #020202;
      width: 30%;
    }
    .primary { border-color: #007bff; }
    .success { border-color: #ad0505; }
  `]
})
export class InputComponent {
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() variant: 'primary' | 'success' = 'primary';
}
