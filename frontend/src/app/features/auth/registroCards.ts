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
    <div class="register-container">
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
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .register-container {
      width: 100%;
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 1.5rem 2.5rem; /* Margen inferior adicional para elevar la tarjeta */
      box-sizing: border-box;
    }

    .register-card {
      display: block;
      width: 100%;
      max-width: 460px;
      margin: 0 auto;
      transform: translateY(-12px); /* Eleva la tarjeta un poco hacia arriba */
    }

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

    .login-link {
      margin-top: 1rem;
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
      transition: opacity 0.2s ease;
    }
    
    .login-btn-link:hover { 
      text-decoration: underline; 
      opacity: 0.85;
    }
  `]
})
export class RegisterCardComponent {
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}