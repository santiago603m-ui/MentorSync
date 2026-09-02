import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginFormComponent } from './login'; 

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  template: `
    <div class="glass-card login-card">
      <div class="circle-avatar">
        <!-- 👇 Icono predeterminado de persona en SVG -->
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
    </div>
  `,
  styles: [`
    .login-card {
      width: 350px;
      text-align: center;
      margin: auto;
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
      color: var(--accent-primary); /* 👈 se adapta al color de tu página */
    }

    h2 {
      margin-bottom: 1rem;
      color: var(--accent-secondary);
      text-shadow: 0 0 10px var(--accent-secondary);
      font-weight: bold;
      letter-spacing: 1px;
    }

    .register-link {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: #fff;
    }

    .register-btn {
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

    .register-btn:hover {
      color: var(--accent-secondary);
    }
  `]
})
export class LoginCardComponent {
  constructor(private router: Router) {}

  goToRegister() {
    this.router.navigate(['/registro']);
  }
}
