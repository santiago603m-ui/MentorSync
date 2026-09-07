import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../shared/services/themeService';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="navbar-inner">
        <a class="brand" routerLink="/" aria-label="Ir al inicio">
          <span class="brand-mark">
            <span class="dot dot-a"></span>
            <span class="dot dot-b"></span>
            <span class="dot dot-c"></span>
          </span>
          <span class="brand-name">MentorSync<span class="brand-accent">AI</span></span>
        </a>

        <button class="menu-toggle" (click)="menuOpen = !menuOpen" [attr.aria-expanded]="menuOpen" aria-label="Abrir menú">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-actions" [class.open]="menuOpen">
          <button *ngIf="isHomePage" (click)="goCursos()" class="nav-link">Cursos</button>
          <button *ngIf="!isHomePage" (click)="goHome()" class="nav-link">Volver al inicio</button>

          <button
            class="theme-toggle"
            type="button"
            (click)="theme.toggle()"
            [attr.aria-pressed]="theme.isCyberpunk()"
            [title]="theme.isCyberpunk() ? 'Volver al tema oscuro' : 'Activar tema cyberpunk'"
          >
            <span class="theme-toggle-dot"></span>
            {{ theme.isCyberpunk() ? 'Cyberpunk' : 'Modo normal' }}
          </button>

          <ng-container *ngIf="isHomePage && !isLoggedIn">
            <button (click)="goLogin()" class="btn outline">Iniciar sesión</button>
            <button (click)="goRegister()" class="btn accent">Regístrate</button>
          </ng-container>

          <ng-container *ngIf="isLoggedIn">
            <button (click)="logout()" class="btn accent">Cerrar sesión</button>
          </ng-container>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--surface-1);
      border-bottom: 1px solid var(--border-subtle);
      transition: box-shadow 0.25s ease, background 0.3s ease, border-color 0.3s ease;
    }
    .navbar.scrolled { box-shadow: 0 4px 16px rgba(0,0,0,0.35); }

    .navbar-inner {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 2rem;
    }

    /* Entrada por CSS puro: arranca ya alineada, sin depender del
       timing de JS/GSAP (evita el salto/flash al cargar la página). */
    .brand, .nav-actions > * {
      animation: navReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .nav-actions > *:nth-child(1) { animation-delay: 0.02s; }
    .nav-actions > *:nth-child(2) { animation-delay: 0.07s; }
    .nav-actions > *:nth-child(3) { animation-delay: 0.12s; }
    .nav-actions > *:nth-child(4) { animation-delay: 0.17s; }
    @keyframes navReveal {
      from { opacity: 0; transform: translateY(-10px) scale(0.92); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .brand, .nav-actions > * { animation: none; }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      flex-shrink: 0;
    }
    .brand-mark {
      display: flex;
      gap: 3px;
      padding: 6px;
      background: var(--surface-2);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot-a { background: var(--accent-violet); }
    .dot-b { background: var(--accent-cyan); }
    .dot-c { background: var(--text-muted); }

    .brand-name {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.15rem;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .brand-accent { color: var(--accent-cyan); }

    .menu-toggle {
      display: none;
      flex-direction: column;
      gap: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.4rem;
    }
    .menu-toggle span {
      width: 20px;
      height: 2px;
      background: var(--text-primary);
      border-radius: 2px;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .nav-link {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      padding: 0.5rem 0.25rem;
      transition: color 0.2s ease;
    }
    .nav-link:hover { color: var(--accent-cyan); }

    .btn {
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border: 1px solid transparent;
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      white-space: nowrap;
    }
    .btn.outline {
      background: transparent;
      border-color: var(--border-strong);
      color: var(--text-primary);
    }
    .btn.outline:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

    .btn.accent {
      background: var(--accent-gradient);
      color: #08101c;
    }
    .btn.accent:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(139,107,255,0.3); }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: var(--surface-2);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-pill);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.82rem;
      padding: 0.45rem 0.9rem 0.45rem 0.6rem;
      cursor: pointer;
      transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
      white-space: nowrap;
    }
    .theme-toggle-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--accent-gradient);
      transition: box-shadow 0.2s ease;
    }
    .theme-toggle:hover {
      border-color: var(--accent-cyan);
      color: var(--text-primary);
    }
    body.theme-cyberpunk .theme-toggle {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 12px rgba(0, 255, 247, 0.35);
    }
    body.theme-cyberpunk .theme-toggle-dot {
      box-shadow: 0 0 8px var(--accent-cyan), 0 0 14px var(--accent-violet);
    }

    @media (max-width: 768px) {
      .navbar-inner { padding: 0.8rem 1.25rem; }
      .menu-toggle { display: flex; }
      .nav-actions {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        background: var(--surface-1);
        border-bottom: 1px solid var(--border-subtle);
        padding: 1rem 1.25rem 1.25rem;
      }
      .nav-actions.open { display: flex; }
      .nav-actions .btn { text-align: center; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isHomePage = false;
  menuOpen = false;
  scrolled = false;

  constructor(private router: Router, public theme: ThemeService) {}

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.updateFlags(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateFlags(event.urlAfterRedirects ?? this.router.url);
        this.menuOpen = false;
      });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 4;
  }

  private updateFlags(url: string) {
    this.isHomePage = url === '/' || url === '';
  }

  goHome() { this.router.navigate(['/']); }
  goLogin() { this.router.navigate(['/login']); }
  goRegister() { this.router.navigate(['/registro']); }
  goCursos() { this.router.navigate(['/cursos']); }
  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }
}
