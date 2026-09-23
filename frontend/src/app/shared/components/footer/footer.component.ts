import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer" role="contentinfo">
      <div class="footer-glow" aria-hidden="true"></div>

      <div class="footer-inner">
        <div class="footer-top">
          <!-- Brand -->
          <div class="footer-brand">
            <a routerLink="/" class="brand">
              <span class="brand-logo"><img src="assets/LogoNavbar.png" alt="MentorSync" class="footer-logo-img" /></span>
              <span class="brand-name">MentorSync<span class="accent">AI</span></span>
            </a>
            <p class="brand-desc">
              Clases en vivo con mentores reales y un asistente de IA entrenado por cada curso. Continuidad de mentoría sin pausas.
            </p>
            <div class="socials">
              <a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>
              <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="X"><i class="fab fa-x-twitter"></i></a>
              <a href="https://discord.com" target="_blank" rel="noopener" aria-label="Discord"><i class="fab fa-discord"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
            </div>
          </div>

          <!-- Plataforma -->
          <nav class="footer-col" aria-label="Plataforma">
            <h4>Plataforma</h4>
            <a routerLink="/">Inicio</a>
            <a routerLink="/cursos">Cursos</a>
            <a href="#how-it-works">Cómo funciona</a>
            <a routerLink="/auth">Crear cuenta</a>
          </nav>

          <!-- Formación -->
          <nav class="footer-col" aria-label="Formación">
            <h4>Formación</h4>
            <a routerLink="/cursos">Catálogo</a>
            <a routerLink="/mentor">Para mentores</a>
            <a routerLink="/aprendiz">Para aprendices</a>
            <a routerLink="/sesion/placeholder" (click)="$event.preventDefault()">Sesiones en vivo</a>
          </nav>

          <!-- Comunidad -->
          <nav class="footer-col" aria-label="Comunidad">
            <h4>Comunidad</h4>
            <a routerLink="/admin">Panel Admin</a>
            <a href="mailto:hola@mentorsync.ai">Soporte</a>
            <a href="#">Guía del mentor</a>
            <a href="#">Estado del sistema</a>
          </nav>
        </div>

        <div class="footer-bottom">
          <span class="copy">© {{ year }} MentorSync — Proyecto SENA ADSO. Hecho con <i class="fas fa-heart" aria-hidden="true"></i> y glassmorphism.</span>
          <div class="bottom-links">
            <a href="#">Privacidad</a>
            <span class="sep">·</span>
            <a href="#">Términos</a>
            <span class="sep">·</span>
            <span class="status"><span class="dot"></span> Operativo</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .footer {
      position: relative;
      margin-top: 4rem;
      padding: 3.2rem 1.5rem 1.6rem;
      background: var(--glass-bg, rgba(22, 17, 40, 0.55));
      border-top: 1px solid var(--glass-border, rgba(255,255,255,0.08));
      backdrop-filter: var(--glass-blur, blur(18px)) saturate(140%);
      -webkit-backdrop-filter: var(--glass-blur, blur(18px)) saturate(140%);
      box-shadow: 0 -8px 32px rgba(0,0,0,0.2);
      overflow: hidden;
    }

    .footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 12%;
      right: 12%;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent-cyan, #22d3ee), var(--accent-violet, #8b6bff), transparent);
      opacity: 0.55;
    }

    .footer-glow {
      position: absolute;
      inset: auto -20% -40% -20%;
      height: 420px;
      background: radial-gradient(ellipse at 30% 0%, rgba(139,107,255,0.14), transparent 55%),
                  radial-gradient(ellipse at 80% 0%, rgba(34,211,238,0.10), transparent 55%);
      pointer-events: none;
      filter: blur(18px);
    }

    .footer-inner {
      position: relative;
      max-width: 1180px;
      margin: 0 auto;
    }

    .footer-top {
      display: grid;
      grid-template-columns: 1.6fr 0.9fr 0.9fr 0.9fr;
      gap: 2.2rem 2rem;
      align-items: start;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      margin-bottom: 0.75rem;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
      overflow: hidden;
      padding: 3px;
    }

    .footer-logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 4px;
      display: block;
    }

    .brand-name {
      font-family: var(--font-display, 'Space Grotesk', sans-serif);
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text-primary, #fff);
      letter-spacing: -0.02em;
    }

    .brand-name .accent { color: var(--accent-cyan, #22D3EE); }

    .brand-desc {
      margin: 0;
      color: var(--text-secondary, #94a3b8);
      font-size: 0.88rem;
      line-height: 1.6;
      max-width: 32ch;
    }

    .socials {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .socials a {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
      color: var(--text-secondary, #94a3b8);
      text-decoration: none;
      transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }

    .socials a:hover {
      background: var(--glass-bg-strong, rgba(255,255,255,0.1));
      color: var(--text-primary, #fff);
      border-color: rgba(34,211,238,0.35);
      transform: translateY(-2px);
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .footer-col h4 {
      margin: 0 0 0.4rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-primary, #fff);
    }

    .footer-col a {
      color: var(--text-secondary, #94a3b8);
      text-decoration: none;
      font-size: 0.86rem;
      line-height: 1.5;
      transition: color 0.18s ease, transform 0.18s ease;
      width: fit-content;
    }

    .footer-col a:hover {
      color: var(--text-primary, #fff);
      transform: translateX(2px);
    }

    .footer-bottom {
      margin-top: 2.4rem;
      padding-top: 1.1rem;
      border-top: 1px solid var(--glass-border, rgba(255,255,255,0.07));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.78rem;
      color: var(--text-muted, #94a3b8);
    }

    .copy {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .copy i { color: #ff5a79; font-size: 0.7rem; }

    .bottom-links {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .bottom-links a {
      color: var(--text-muted, #94a3b8);
      text-decoration: none;
    }

    .bottom-links a:hover { color: var(--text-primary, #fff); }
    .sep { opacity: 0.45; }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-secondary, #94a3b8);
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.18), 0 0 10px rgba(34,197,94,0.6);
    }

    @media (max-width: 900px) {
      .footer-top { grid-template-columns: 1fr 1fr; gap: 1.8rem 1.5rem; }
      .footer-brand { grid-column: 1 / -1; }
    }

    @media (max-width: 560px) {
      .footer { padding: 2.2rem 1rem 1.2rem; margin-top: 2.5rem; }
      .footer-top { grid-template-columns: 1fr 1fr; gap: 1.5rem 1rem; }
      .footer-col h4 { font-size: 0.68rem; }
      .footer-bottom { flex-direction: column; align-items: flex-start; gap: 0.6rem; }
      .brand-desc { max-width: none; }
    }

    @media (max-width: 380px) {
      .footer-top { grid-template-columns: 1fr; }
    }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
