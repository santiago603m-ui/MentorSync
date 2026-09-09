import { Component, OnInit, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../shared/services/themeService';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="navbar-inner">
        <a class="brand" (click)="goHome()" style="cursor: pointer;" aria-label="Ir al inicio">
          <span class="brand-mark">
            <span class="dot dot-a"></span>
            <span class="dot dot-b"></span>
            <span class="dot dot-c"></span>
          </span>
          <span class="brand-name">MentorSync<span class="brand-accent">AI</span></span>
        </a>

        <div class="nav-actions">
          <!-- CASO 1: Sesión Detectada O Ruta Protegida (Se muestra de inmediato) -->
          @if (isLoggedIn || isDashboardRoute) {
            <button class="theme-toggle" type="button" (click)="theme.toggle()">
              <span class="theme-toggle-dot"></span>
              {{ theme.isCyberpunk() ? 'Cyberpunk' : 'Modo normal' }}
            </button>

            <!-- Campanita de Notificaciones -->
            <button class="icon-btn" title="Notificaciones pendientes" (click)="goNotificaciones()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>

            <!-- Perfil Desplegable -->
            <div class="profile-dropdown-container">
              <button class="icon-btn profile-trigger" (click)="toggleProfileMenu($event)" title="Perfil">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>

              @if (profileMenuOpen) {
                <div class="dropdown-menu">
                  <div class="dropdown-header">
                    <span class="role-badge" [ngClass]="userRole">{{ userRole }}</span>
                  </div>
                  <button (click)="goEditarPerfil()" class="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Editar Perfil
                  </button>
                  <hr class="dropdown-divider" />
                  <button (click)="logout()" class="dropdown-item danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              }
            </div>
          }

          <!-- CASO 2: Páginas secundarias públicas (Login, Registro) -->
          @else if (isMinimalHeaderPage) {
            <button (click)="goHome()" class="nav-link">Volver al inicio</button>
            <button class="theme-toggle" type="button" (click)="theme.toggle()">
              <span class="theme-toggle-dot"></span>
              {{ theme.isCyberpunk() ? 'Cyberpunk' : 'Modo normal' }}
            </button>
          }

          <!-- CASO 3: Landing / Visitante no autenticado -->
          @else {
            @if (isHomePage) {
              <button (click)="goCursos()" class="nav-link">Cursos</button>
            } @else {
              <button (click)="goHome()" class="nav-link">Volver al inicio</button>
            }

            <button class="theme-toggle" type="button" (click)="theme.toggle()">
              <span class="theme-toggle-dot"></span>
              {{ theme.isCyberpunk() ? 'Cyberpunk' : 'Modo normal' }}
            </button>

            <button (click)="goLogin()" class="btn outline">Iniciar sesión</button>
            <button (click)="goRegister()" class="btn accent">Regístrate</button>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { position: sticky; top: 0; z-index: 100; background: var(--surface-1); border-bottom: 1px solid var(--border-subtle); }
    .navbar-inner { max-width: 1300px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 2rem; }
    .brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; }
    .brand-mark { display: flex; gap: 3px; padding: 6px; background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot-a { background: var(--accent-violet); } .dot-b { background: var(--accent-cyan); } .dot-c { background: var(--text-muted); }
    .brand-name { font-weight: 700; font-size: 1.15rem; color: var(--text-primary); }
    .brand-accent { color: var(--accent-cyan); }
    .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
    .nav-link { background: transparent; border: none; color: var(--text-secondary); font-weight: 600; cursor: pointer; }
    .btn { padding: 0.6rem 1.25rem; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn.outline { background: transparent; border-color: var(--border-strong); color: var(--text-primary); }
    .btn.accent { background: var(--accent-gradient); color: #08101c; }
    .icon-btn { 
      background: var(--surface-2); 
      border: 1px solid var(--border-subtle); 
      color: var(--text-primary); 
      padding: 0.6rem; 
      border-radius: var(--radius-sm); 
      cursor: pointer; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
    }
    .theme-toggle { display: flex; align-items: center; gap: 0.45rem; background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); color: var(--text-secondary); padding: 0.45rem 0.9rem; cursor: pointer; }
    .theme-toggle-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent-gradient); }

    .profile-dropdown-container { position: relative; }
    .dropdown-menu { position: absolute; right: 0; top: calc(100% + 0.5rem); background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); padding: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem; z-index: 1000; }
    .dropdown-header { padding: 0.25rem 0.5rem; }
    .role-badge { font-size: 0.75rem; text-transform: uppercase; background: var(--accent-violet); color: #fff; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; }
    .role-badge.admin { background: #e63946; }
    .role-badge.mentor { background: #00b4d8; }
    .role-badge.aprendiz { background: var(--accent-violet); }
    .dropdown-item { background: transparent; border: none; color: var(--text-primary); padding: 0.5rem; text-align: left; width: 100%; cursor: pointer; border-radius: 4px; font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem; }
    .dropdown-item:hover { background: var(--surface-1); color: var(--accent-cyan); }
    .dropdown-item.danger { color: #ff5555; }
    .dropdown-item.danger:hover { background: rgba(255, 85, 85, 0.1); }
    .dropdown-divider { border: 0; border-top: 1px solid var(--border-subtle); margin: 0.25rem 0; }
  `]
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isHomePage = false;
  isMinimalHeaderPage = false;
  isDashboardRoute = false;
  scrolled = false;
  profileMenuOpen = false;
  userRole = 'aprendiz';

  constructor(
    private router: Router, 
    public theme: ThemeService, 
    private authService: AuthService,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Verificación sincrónica instantánea (Lee localStorage / token de inmediato)
    this.syncAuthState();

    // 2. Escuchar cambios de estado vía Observable
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      this.checkRouteState(this.router.url);
      this.cdr.detectChanges();
    });

    this.authService.userRole$.subscribe(rawRol => {
      const r = rawRol?.toLowerCase() || '';
      this.userRole = (r === 'admin' || r === 'administrador') ? 'admin' : (r === 'mentor' ? 'mentor' : 'aprendiz');
      this.checkRouteState(this.router.url);
      this.cdr.detectChanges();
    });

    // 3. Reaccionar en cada navegación
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((val: any) => {
      const url = val.urlAfterRedirects || val.url;
      this.syncAuthState();
      this.checkRouteState(url);
      this.profileMenuOpen = false;
      this.cdr.detectChanges();
    });
  }

  private syncAuthState() {
    // Revisa si existe un token o usuario guardado en localStorage/sessionStorage
    const hasToken = !!localStorage.getItem('token') || !!sessionStorage.getItem('token') || !!localStorage.getItem('user');
    this.isLoggedIn = this.authService.isLoggedIn() || hasToken;
  }

  private checkRouteState(url: string) {
    const currentUrl = url || window.location.pathname;
    this.isHomePage = currentUrl === '/' || currentUrl === '';
    
    // Detecta rutas de los dashboards
    this.isDashboardRoute = 
      currentUrl.includes('/aprendiz') || 
      currentUrl.includes('/mentor') || 
      currentUrl.includes('/admin') || 
      currentUrl.includes('/administrador');

    this.isMinimalHeaderPage = (currentUrl.includes('/login') || currentUrl.includes('/registro')) && !this.isDashboardRoute;
  }

  @HostListener('window:scroll') onScroll() { 
    this.scrolled = window.scrollY > 4; 
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.profileMenuOpen = false;
    }
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  goHome() { 
    if (this.isDashboardRoute || this.isLoggedIn) {
      if (this.userRole === 'admin') {
        this.router.navigate(['/admin']);
        return;
      }
      if (this.userRole === 'mentor') {
        this.router.navigate(['/mentor']);
        return;
      }
      this.router.navigate(['/aprendiz']);
      return;
    }
    this.router.navigate(['/']); 
  }

  goLogin() { this.router.navigate(['/login']); }
  goRegister() { this.router.navigate(['/registro']); }
  goCursos() { this.router.navigate(['/cursos']); }
  goNotificaciones() { this.router.navigate(['/notificaciones']); }
  goEditarPerfil() { this.router.navigate(['/perfil']); }

  logout() {
    this.authService.logout();
    this.profileMenuOpen = false;
    this.router.navigate(['/']);
  }
}