import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginCardComponent } from '../loginCards';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, LoginCardComponent],
  template: `
    <div class="login-page">
      <div class="info-section">
        <h1>
          Bienvenido de nuevo <br>
          <span>MentorSync AI</span>
        </h1>
        <p>
          Ingresa para continuar tu aprendizaje con mentores reales y su IA.
        </p>
      </div>

      <div class="form-section">
        <app-login-card></app-login-card>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      color: #fff;
      width: 100%;
      height: 100%; /* 👈 ocupa toda la pantalla disponible */
      justify-content: center;
      align-items: center; /* 👈 centra verticalmente */
      box-sizing: border-box;
    }

    .info-section {
      flex: 1 1 300px;
      max-width: 500px; /* 👈 límite para el texto */
    }

    .form-section {
      flex: 1 1 300px;
      max-width: 400px; /* 👈 límite del formulario */
      width: 100%;
      display: flex;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .login-page {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .info-section, .form-section {
        max-width: 100%;
      }
    }
  `]
})
export class LoginPageComponent {}
