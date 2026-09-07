import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginCardComponent } from '../loginCards';
import gsap from 'gsap';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, LoginCardComponent],
  template: `
    <div class="login-page">
      <div class="info-section">
        <h1>Bienvenido de nuevo a<br><span class="grad-text">MentorSync AI</span></h1>
        <p>Ingresa para continuar tu aprendizaje con mentores reales y su asistente de IA.</p>
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
      gap: 3rem;
      width: 100%;
      min-height: calc(100vh - 130px);
      justify-content: center;
      align-items: center;
      padding: 3rem 0;
      box-sizing: border-box;
    }

    .info-section { flex: 1 1 320px; max-width: 480px; }
    .info-section h1 { font-size: clamp(1.6rem, 3vw, 2.3rem); line-height: 1.25; margin-bottom: 1rem; }
    .grad-text {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .info-section p { color: var(--text-secondary); line-height: 1.6; }

    .form-section {
      flex: 1 1 320px;
      max-width: 400px;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .login-page { flex-direction: column; text-align: center; }
      .info-section, .form-section { max-width: 100%; }
    }
  `]
})
export class LoginPageComponent implements AfterViewInit {
  ngAfterViewInit() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.info-section, .form-section', {
      opacity: 0, y: 16, stagger: 0.12, duration: 0.6, ease: 'power2.out'
    });
  }
}
