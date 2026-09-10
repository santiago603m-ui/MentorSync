import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegisterFormComponent } from '../../pages/registro/registro.component';

@Component({
  selector: 'app-register-card',
  standalone: true,
  imports: [CommonModule, RegisterFormComponent],
  template: `
    <div class="register-card">
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
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      padding: 1.5rem 1rem;
    }

    .register-card {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 440px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 1rem;
      padding: 2rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.18);
      margin-top: 5rem;
    }

    .circle-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin: 0 auto 0.6rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(14, 165, 233, 0.15));
      border: 1px solid rgba(99, 102, 241, 0.4);
    }

    .circle-avatar svg { 
      width: 46%; 
      height: 46%; 
      color: #818cf8;
    }

    h2 {
      text-align: center;
      margin-bottom: 0.85rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .login-link {
      margin-top: 0.85rem;
      font-size: 0.85rem;
      color: #94a3b8;
      text-align: center;
    }

    .login-btn-link {
      background: none;
      border: none;
      color: #22d3ee;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      margin-left: 0.3rem;
      font-size: 0.85rem;
    }
    
    .login-btn-link:hover { 
      color: #67e8f9;
      text-decoration: underline; 
    }
  `]
})
export class RegisterCardComponent {
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}