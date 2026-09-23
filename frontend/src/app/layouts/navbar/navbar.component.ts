import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

type Rol = 'aprendiz' | 'mentor' | 'administrador';

interface EnlaceModulo {
  etiqueta: string;
  ruta: string;
}

function decodificarPayloadJWT(token: string): { id: string; rol: Rol; email: string } | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(payloadJson);

    if (parsed && parsed.rol) {
      parsed.rol = parsed.rol.toLowerCase() as Rol;
    }
    return parsed;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled()">
      <div class="navbar-inner">
        <a class="brand" routerLink="/" aria-label="Ir al inicio">
          <span class="brand-name">MentorSync<span class="brand-accent">AI</span></span>
        </a>

        <button
          class="menu-toggle"
          (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Abrir menú"
        >
          <span></span><span></span><span></span>
        </button>

        <div class="nav-actions" [class.open]="menuOpen()">
          <ng-container *ngIf="isLoggedIn()">
            <button
              *ngFor="let enlace of enlacesModulos()"
              class="nav-link"
              [routerLink]="enlace.ruta"
              routerLinkActive="active"
            >
              {{ enlace.etiqueta }}
            </button>
          </ng-container>

          <ng-container *ngIf="!isLoggedIn() && isHomePage()">
            <button (click)="goLogin()" class="btn outline">Iniciar sesión</button>
            <button (click)="goRegister()" class="btn accent">Regístrate</button>
          </ng-container>

          <ng-container *ngIf="!isLoggedIn() && !isHomePage()">
            <button (click)="goHome()" class="nav-link">Volver al inicio</button>
          </ng-container>

          <button *ngIf="isLoggedIn()" (click)="logout()" class="btn accent">Cerrar sesión</button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 1.4rem;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 3rem);
      max-width: 1180px;
      z-index: 100;

      background: var(--glass-bg, rgba(22, 17, 40, 0.5));
      border-radius: var(--radius-lg, 22px);
      backdrop-filter: var(--glass-blur, blur(20px)) saturate(160%);
      -webkit-backdrop-filter: var(--glass-blur, blur(20px)) saturate(160%);

      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.14),
        0 20px 50px -12px rgba(76, 47, 184, 0.35),
        0 8px 24px rgba(0, 0, 0, 0.4);

      transition: box-shadow 0.3s ease, background 0.35s ease, top 0.25s ease;
    }
    .navbar.scrolled {
      top: 0.85rem;
      background: var(--glass-bg-strong, rgba(22, 17, 40, 0.75));
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 24px 60px -14px rgba(76, 47, 184, 0.42),
        0 10px 28px rgba(0, 0, 0, 0.5);
    }

    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 0.85rem 1.7rem;
    }

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
      gap: 0.7rem;
      text-decoration: none;
      flex-shrink: 0;
    }

    .brand-name {
      font-family: var(--font-display, inherit);
      font-weight: 700;
      font-size: 1.15rem;
      color: var(--text-primary, #fff);
      letter-spacing: -0.01em;
      white-space: nowrap;
    }
    .brand-accent { color: var(--accent-cyan, #22D3EE); }

    /* LOGO CSS */
    .brand-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #7C5CFF 0%, #22D3EE 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(124, 92, 255, 0.4);
      flex-shrink: 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .brand:hover .brand-logo {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(124, 92, 255, 0.6);
    }

    .logo-m {
      color: #fff;
      font-size: 20px;
      font-weight: 700;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
      line-height: 1;
    }



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
      background: var(--text-primary, #fff);
      border-radius: 2px;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .nav-actions::before {
      content: '';
      width: 1px;
      height: 22px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 0.3rem;
    }
    .nav-actions:has(.nav-link:only-child)::before,
    .nav-actions:not(:has(.nav-link))::before {
      display: none;
    }

    .nav-link {
      position: relative;
      background: transparent;
      border: none;
      color: var(--text-secondary, #c7c7d6);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0.55rem 0.9rem;
      border-radius: var(--radius-pill, 999px);
      transition: color 0.2s ease, background 0.2s ease;
    }
    .nav-link:hover { color: var(--text-primary, #fff); background: rgba(255, 255, 255, 0.06); }
    .nav-link.active {
      color: var(--text-primary, #fff);
    }
    .nav-link.active::after {
      content: '';
      position: absolute;
      left: 0.9rem;
      right: 0.9rem;
      bottom: 0.25rem;
      height: 2px;
      border-radius: 2px;
      background: var(--accent-gradient, linear-gradient(135deg, #7C5CFF, #22D3EE));
    }

    .btn {
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-pill, 999px);
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      border: 1px solid transparent;
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      white-space: nowrap;
    }
    .btn.outline {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.16);
      color: var(--text-primary, #fff);
    }
    .btn.outline:hover { border-color: var(--accent-cyan, #22D3EE); color: var(--accent-cyan, #22D3EE); }

    .btn.accent {
      background: var(--accent-gradient, linear-gradient(135deg, #7C5CFF, #22D3EE));
      color: #08101c;
    }
    .btn.accent:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(139, 107, 255, 0.4); }



    @media (max-width: 768px) {
      .navbar { width: calc(100% - 1.4rem); top: 0.8rem; }
      .navbar-inner { padding: 0.7rem 1.1rem; }
      .menu-toggle { display: flex; }
      .nav-actions {
        display: none;
        position: absolute;
        top: calc(100% + 0.7rem);
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        background: var(--glass-bg-strong, rgba(22, 17, 40, 0.88));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg, 20px);
        backdrop-filter: var(--glass-blur, blur(20px));
        -webkit-backdrop-filter: var(--glass-blur, blur(20px));
        padding: 1rem;
      }
      .nav-actions::before { display: none; }
      .nav-actions.open { display: flex; }
      .nav-actions .btn, .nav-actions .nav-link { text-align: center; }
    }
  `],
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);

  isLoggedIn = signal(false);
  rol = signal<Rol | null>(null);
  isHomePage = signal(false);
  menuOpen = signal(false);
  scrolled = signal(false);

  enlacesModulos = computed<EnlaceModulo[]>(() => {
    const enlaces: EnlaceModulo[] = [{ etiqueta: 'Cursos', ruta: '/cursos' }];

    const rolActual = this.rol();
    if (rolActual === 'aprendiz') {
      enlaces.push({ etiqueta: 'Mi Panel', ruta: '/aprendiz' });
    } else if (rolActual === 'mentor') {
      enlaces.push({ etiqueta: 'Mi Dashboard', ruta: '/mentor' });
    } else if (rolActual === 'administrador') {
      enlaces.push({ etiqueta: 'Panel Admin', ruta: '/admin' });
    }

    return enlaces;
  });

  ngOnInit() {
    this.actualizarSesion();
    this.updateFlags(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.actualizarSesion();
        this.updateFlags(event.urlAfterRedirects ?? this.router.url);
        this.menuOpen.set(false);
      });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 4);
  }

  private actualizarSesion() {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      this.isLoggedIn.set(false);
      this.rol.set(null);
      return;
    }

    const payload = decodificarPayloadJWT(token);
    this.isLoggedIn.set(!!payload);
    this.rol.set(payload?.rol ?? null);
  }

  private updateFlags(url: string) {
    this.isHomePage.set(url === '/' || url === '');
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goLogin() {
    this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
  }

  goRegister() {
    this.router.navigate(['/auth'], { queryParams: { mode: 'registro' } });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    this.isLoggedIn.set(false);
    this.rol.set(null);
    this.router.navigate(['/']);
  }
}