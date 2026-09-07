import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegisterFormComponent } from './registro';
import { GlassCardComponent } from '../../shared/components/glassCard';

@Component({
  selector: 'app-register-card',
  standalone: true,
  imports: [CommonModule, RegisterFormComponent, GlassCardComponent],
  template: `
    <app-glass-card label="registro.ts" class="register-card">
      <div class="circle-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor"
                d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
        </svg>
      </div>

      <h2>Crea tu cuenta</h2>
      <app-register-form></app-register-form>

      <p class="login-link">
        ¿Ya tienes cuenta?
        <button type="button" class="login-btn-link" (click)="goToLogin()">Inicia sesión</button>
      </p>
    </app-glass-card>
  `,
  styles: [`
    .register-card { display: block; margin: 0 auto; }

    .circle-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      margin: 0 auto 1.25rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-1);
      border: 1px solid var(--border-subtle);
    }
    .circle-avatar svg { width: 55%; height: 55%; color: var(--accent-violet); }

    h2 {
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 1.3rem;
    }

    .login-link {
      margin-top: 1.25rem;
      font-size: 0.88rem;
      color: var(--text-secondary);
      text-align: center;
    }

    .login-btn-link {
      background: none;
      border: none;
      color: var(--accent-cyan);
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      margin-left: 0.3rem;
      font-size: 0.88rem;
    }
    .login-btn-link:hover { text-decoration: underline; }
  `]
})
export class RegisterCardComponent {
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
