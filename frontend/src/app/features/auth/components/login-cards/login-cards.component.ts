import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginFormComponent } from '../../pages/login/login.component';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, GlassCardComponent],
  template: `
    <app-glass-card label="login.ts" class="login-card">
      <div class="circle-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
        </svg>
      </div>
      <h2>Inicia sesión</h2>
      <app-login-form></app-login-form>

      <p class="register-link">
        ¿No tienes cuenta?
        <button type="button" class="register-btn" (click)="goToRegister()">Regístrate</button>
      </p>
    </app-glass-card>
  `,
  styles: [`
    .login-card { display: block; margin: 0 auto; }

    .circle-avatar {
      width: 56px; /* Ajuste sutil de tamaño para compactar alto */
      height: 56px;
      border-radius: 50%;
      margin: 0 auto 0.75rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-1);
      border: 1px solid var(--border-subtle);
    }
    
    .circle-avatar svg { 
      width: 55%; 
      height: 55%; 
      color: var(--accent-violet); 
    }

    h2 {
      text-align: center;
      margin-bottom: 1rem;
      font-size: 1.25rem;
      color: var(--text-primary, #ffffff);
    }

    .register-link {
      margin-top: 1.25rem;
      font-size: 0.88rem;
      color: var(--text-secondary);
      text-align: center;
    }

    .register-btn {
      background: none;
      border: none;
      color: var(--accent-cyan);
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      margin-left: 0.3rem;
      font-size: 0.88rem;
      transition: opacity 0.2s ease;
    }
    
    .login-btn-link:hover { 
      text-decoration: underline; 
      opacity: 0.85;
    }
    .register-btn:hover { text-decoration: underline; }
  `]
})
export class LoginCardComponent {
  constructor(private router: Router) {}

  goToRegister() {
    this.router.navigate(['/registro']);
  }
}