import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="layout-container">
      <canvas #starCanvas class="constellation-bg" aria-hidden="true"></canvas>

      <app-navbar></app-navbar>

      <main class="layout-content">
        <div class="page-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>

      <footer class="site-footer">© 2026 MentorSync AI</footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .layout-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 100vh;
      position: relative;
      background: var(--bg-base);
      overflow: hidden;
    }

    .constellation-bg {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      opacity: 0.85;
      pointer-events: none;
    }

    /* Ocupa todo el espacio restante entre Navbar y Footer */
    .layout-content {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
      overflow: hidden; /* Permite scroll interno si la página lo requiere */
    }

    /* Expande el contenedor interno al 100% sin restricción de max-width */
    .page-wrapper {
      width: 100%;
      height: 100%;
      max-width: 100%; /* Cambiado de 1300px a 100% */
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 0; /* Removido el padding lateral para control total en la vista */
    }

    .site-footer {
      text-align: center;
      padding: 0.75rem 1.25rem;
      background: var(--surface-1);
      border-top: 1px solid var(--border-subtle);
      color: var(--text-muted);
      position: relative;
      z-index: 1;
      font-size: 0.82rem;
      flex-shrink: 0; /* Impide que el footer se reduzca o tape vistas */
    }
  `]
})
export class ResponsiveLayoutComponent implements AfterViewInit, OnDestroy {
  @ViewChild('starCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: { x: number; y: number; vx: number; vy: number }[] = [];
  private animId = 0;
  private readonly PARTICLE_COUNT = 80;
  private readonly LINK_DIST = 140;
  private reducedMotion = false;

  constructor(private theme: ThemeService) {}

  ngAfterViewInit() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.reducedMotion) {
      this.initCanvas();
      window.addEventListener('resize', this.resizeCanvas);
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resizeCanvas);
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    this.particles = Array.from({ length: this.PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15
    }));

    this.animate();
  }

  private resizeCanvas = () => {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  private animate = () => {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cyberpunk = this.theme.isCyberpunk();
    const dotColor = cyberpunk ? '255, 42, 251' : '139, 107, 255';
    const lineColor = cyberpunk ? '0, 255, 247' : '34, 211, 238';

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor}, 0.85)`;
      ctx.fill();
    }

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < this.LINK_DIST) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${lineColor}, ${0.32 * (1 - dist / this.LINK_DIST)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    this.animId = requestAnimationFrame(this.animate);
  };
}