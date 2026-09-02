import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegisterFormComponent } from './registro';

@Component({
  selector: 'app-register-card',
  standalone: true,
  imports: [CommonModule, RegisterFormComponent],
  template: `
    <div class="page-container wave-background">
      <div class="glass-card register-card">
        <div class="circle-avatar">
          <!-- Ícono de persona en SVG -->
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
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--bg-gradient);
      overflow: hidden;
    }

    .register-card {
      width: 350px;
      text-align: center;
      margin: auto;
      position: relative;
      z-index: 1; /* 👈 la card queda encima de las olas */
    }

    .circle-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      margin: 0 auto 1rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--glass-bg);
      box-shadow: 0 0 20px var(--accent-secondary);
    }

    .circle-avatar svg {
      width: 70%;
      height: 70%;
      color: var(--accent-primary);
    }

    h2 {
      margin-bottom: 1rem;
      color: var(--accent-secondary);
      text-shadow: 0 0 10px var(--accent-secondary);
      font-weight: bold;
      letter-spacing: 1px;
    }

    .login-link {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: #fff;
    }

    .login-btn-link {
      background: none;
      border: none;
      color: var(--accent-primary);
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      margin-left: 0.3rem;
      font-size: 0.9rem;
      text-decoration: underline;
    }

    .login-btn-link:hover {
      color: var(--accent-secondary);
    }

    /* Animación de olas (ya definida en styles.css global) */
    .wave-background::before,
    .wave-background::after {
      content: '';
      position: absolute;
      width: 200%;
      height: 200px;
      left: -50%;
      bottom: 0;
      background: rgba(34, 211, 238, 0.2);
      border-radius: 100%;
      animation: wave 8s infinite linear;
      z-index: 0;
    }

    .wave-background::after {
      animation-delay: -4s;
      background: rgba(124, 92, 255, 0.2);
    }

    @keyframes wave {
      0% { transform: translateX(0); }
      100% { transform: translateX(50%); }
    }
  `]
})
export class RegisterCardComponent {
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
