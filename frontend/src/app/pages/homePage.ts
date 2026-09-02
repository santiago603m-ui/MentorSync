import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <h1>Aprende a programar con mentores reales, sin pausas.</h1>
      <p>
        Clases en vivo, un asistente con la personalidad de tu mentor que responde cuando él no puede,
        y una comunidad activa de gente construyendo lo mismo que tú.
      </p>
      <div class="hero-buttons">
        <button class="btn accent">Empezar gratis</button>
        <button class="btn">Explorar cursos →</button>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 4rem 2rem;
      color: #fff;
    }

    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      text-shadow: 0 0 15px var(--accent-primary);
    }

    .hero p {
      max-width: 600px;
      margin-bottom: 2rem;
      color: #ccc;
      line-height: 1.5;
    }

    .hero-buttons {
      display: flex;
      gap: 1rem;
    }

    .hero-buttons .btn {
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      background: var(--glass-bg);
      color: #fff;
      transition: 0.3s;
    }

    .hero-buttons .btn.accent {
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
      box-shadow: 0 0 20px var(--accent-secondary);
    }

    .hero-buttons .btn:hover {
      transform: scale(1.05);
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 1.8rem;
      }
      .hero-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class HomePage {}
