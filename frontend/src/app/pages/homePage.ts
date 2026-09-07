import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <h1 class="hero-title">
          Aprende a programar con
          <span class="grad-text">mentores reales</span>,
          sin pausas.
        </h1>

        <p class="hero-subtitle">
          Clases en vivo, un asistente con la personalidad de tu mentor que
          responde cuando él no puede, y una comunidad activa construyendo
          lo mismo que tú.
        </p>

        <div class="hero-actions">
          <button class="cta-primary" (click)="goRegister()">Empezar gratis</button>
          <button class="cta-secondary" (click)="goCursos()">Explorar cursos →</button>
        </div>

        <div class="mentor-strip">
          <div class="avatar-stack">
            <span class="avatar av-1"></span>
            <span class="avatar av-2"></span>
            <span class="avatar av-3"></span>
          </div>
          <span class="mentor-strip-text">+120 mentores activos esta semana</span>
        </div>
      </div>

      <div class="session-window">
        <div class="session-header">
          <span class="dot dot-a"></span>
          <span class="dot dot-b"></span>
          <span class="dot dot-c"></span>
          <span class="session-title">sesion_en_vivo.ts</span>
          <span class="live-badge"><span class="live-dot"></span>En vivo</span>
        </div>

        <div class="session-body">
          <div class="code-line l1"><span class="tok-kw">const</span> mentor = <span class="tok-str">"Camila Ruiz"</span>;</div>
          <div class="code-line l2"><span class="tok-kw">function</span> <span class="tok-fn">explicarClosures</span>() &#123;</div>
          <div class="code-line l3">&nbsp;&nbsp;<span class="tok-kw">return</span> <span class="tok-str">"con un ejemplo real"</span>;</div>
          <div class="code-line l4">&#125;</div>

          <div class="chat-bubble">
            <span class="chat-avatar">AI</span>
            <div class="chat-text">
              <strong>Asistente de Camila</strong>
              <p>Mientras ella no está, te explico closures paso a paso →</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 3rem;
      align-items: center;
      padding: 4rem 0 3rem;
      width: 100%;
    }

    .hero-copy { text-align: left; }

    .hero-title {
      font-size: clamp(2rem, 3.6vw, 3rem);
      font-weight: 700;
      line-height: 1.15;
      margin-bottom: 1.25rem;
    }

    .grad-text {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .hero-subtitle {
      max-width: 480px;
      color: var(--text-secondary);
      font-size: 1.02rem;
      line-height: 1.65;
      margin-bottom: 2rem;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2.5rem;
    }

    .cta-primary, .cta-secondary {
      padding: 0.85rem 1.7rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      border: 1px solid transparent;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .cta-primary {
      background: var(--accent-gradient);
      color: #08101c;
    }
    .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(139,107,255,0.3); }

    .cta-secondary {
      background: transparent;
      color: var(--text-primary);
      border-color: var(--border-strong);
    }
    .cta-secondary:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

    .mentor-strip {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .avatar-stack { display: flex; }
    .avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      border: 2px solid var(--bg-base);
      margin-left: -8px;
    }
    .avatar:first-child { margin-left: 0; }
    .av-1 { background: linear-gradient(135deg, var(--accent-violet), #4c2fb8); }
    .av-2 { background: linear-gradient(135deg, var(--accent-cyan), #0e6f7e); }
    .av-3 { background: linear-gradient(135deg, #8B6BFF, #22D3EE); }
    .mentor-strip-text { font-size: 0.85rem; color: var(--text-muted); }

    /* ---- Ventana de sesión ---- */
    .session-window {
      background: var(--surface-2);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-pop);
      overflow: hidden;
      width: 100%;
    }

    .session-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.7rem 1rem;
      background: var(--surface-1);
      border-bottom: 1px solid var(--border-subtle);
    }
    .dot { width: 9px; height: 9px; border-radius: 50%; }
    .dot-a { background: var(--accent-violet); }
    .dot-b { background: var(--accent-cyan); }
    .dot-c { background: var(--text-muted); }
    .session-title {
      margin-left: 0.4rem;
      font-size: 0.78rem;
      color: var(--text-muted);
      font-family: 'SFMono-Regular', Consolas, monospace;
    }
    .live-badge {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--accent-cyan);
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--accent-cyan);
      animation: blink 1.6s ease-in-out infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

    .session-body {
      padding: 1.4rem 1.5rem;
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 0.85rem;
      line-height: 1.9;
    }
    .code-line { color: var(--text-secondary); white-space: pre; overflow: hidden; }
    .tok-kw { color: var(--accent-violet); }
    .tok-str { color: var(--accent-cyan); }
    .tok-fn { color: #E8B76A; }

    .chat-bubble {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.3rem;
      padding: 0.9rem 1rem;
      background: var(--surface-1);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      font-family: var(--font-body);
      opacity: 0;
      transform: translateY(8px);
    }
    .chat-avatar {
      flex-shrink: 0;
      width: 28px; height: 28px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: #08101c;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .chat-text strong { display: block; font-size: 0.82rem; color: var(--text-primary); margin-bottom: 0.2rem; }
    .chat-text p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; padding: 2.5rem 0; }
      .hero-copy { text-align: center; }
      .hero-subtitle { margin-left: auto; margin-right: auto; }
      .hero-actions { justify-content: center; }
      .mentor-strip { justify-content: center; }
    }
  `]
})
export class HomePage implements AfterViewInit {
  constructor(private router: Router) {}

  ngAfterViewInit() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      gsap.set('.chat-bubble', { opacity: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-title', { opacity: 0, y: 45, duration: 0.4 })
      .from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.35 }, '-=0.2')
      .from('.hero-actions > *', { opacity: 0, y: 30, scale: 0.85, stagger: 0.08, duration: 0.35, ease: 'back.out(1.7)' }, '-=0.15')
      .from('.mentor-strip', { opacity: 0, y: 20, duration: 0.3 }, '-=0.1')
      .from('.session-window', { opacity: 0, x: 60, scale: 0.92, duration: 0.45, ease: 'power3.out' }, '-=0.35')
      .from('.code-line', {
        clipPath: 'inset(0 100% 0 0)',
        stagger: 0.1,
        duration: 0.25,
        ease: 'steps(14)'
      }, '-=0.1')
      .fromTo('.chat-bubble',
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.7)' },
        '+=0.05');
  }

  goRegister() { this.router.navigate(['/registro']); }
  goCursos() { this.router.navigate(['/cursos']); }
}
