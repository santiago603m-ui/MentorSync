import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterCardComponent } from '../registroCards';

@Component({
  selector: 'app-registro-page',
  standalone: true,
  imports: [CommonModule, RegisterCardComponent],
  template: `
    <div class="registro-page">
      <div class="info-section">
        <h1>
          Aprende con mentores reales.<br>
          <span>Sigue aprendiendo con su IA.</span>
        </h1>
        <p>
          Cada curso incluye un asistente entrenado por tu mentor, disponible incluso cuando él o ella no está conectado.
        </p>
        <footer>© 2026 MentorSync AI</footer>
      </div>

      <div class="form-section">
        <app-register-card></app-register-card>
      </div>
    </div>
  `,
  styles: [`
    .registro-page {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      color: #fff;
      width: 100%;
      height: 100%; /* 👈 ocupa toda la pantalla */
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
      .registro-page {
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
export class RegistroPageComponent {}
