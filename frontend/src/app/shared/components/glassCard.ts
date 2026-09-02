import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-glass-card',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="glass-card"><ng-content></ng-content></div>`,
  styles: [`
    .glass-card {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      box-shadow: var(--glass-shadow);
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      color: #fff;
    }
  `]
})
export class GlassCardComponent {}
