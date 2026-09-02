import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="layout-container">
      <!-- Navbar global -->
      <nav class="glass-navbar">
        <div class="logo">MentorSync AI</div>

        <div class="auth-buttons">
          <!-- Estado: no logueado -->
          <ng-container *ngIf="!isLoggedIn; else loggedInBlock">
            <button *ngIf="!isLoginOrRegisterPage" (click)="goLogin()" class="btn">Login</button>
            <button *ngIf="!isLoginOrRegisterPage" (click)="goRegister()" class="btn accent">Regístrate</button>
            <button *ngIf="isLoginOrRegisterPage" (click)="goHome()" class="btn">Volver</button>
          </ng-container>

          <!-- Estado: logueado -->
          <ng-template #loggedInBlock>
            <button (click)="logout()" class="btn accent">Cerrar sesión</button>
          </ng-template>
        </div>
      </nav>

      <!-- Contenido dinámico -->
      <main class="layout-content">
        <div class="page-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Footer global -->
      <footer class="glass-footer">
        © 2026 MentorSync AI
      </footer>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--bg-gradient);
    }

    .layout-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh; /* 👈 ocupa toda la pantalla */
      box-sizing: border-box;
      padding: 2rem;
    }

    .page-wrapper {
      width: 100%;
      max-width: 1200px;
      height: 100%; /* 👈 se ajusta al alto disponible */
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .glass-footer {
      text-align: center;
      padding: 1rem;
      background: var(--glass-bg);
      border-top: 1px solid var(--glass-border);
      color: #fff;
    }

    .glass-navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border-bottom: 1px solid var(--glass-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo {
      font-weight: bold;
      font-size: 1.2rem;
      color: var(--accent-primary);
    }

    .auth-buttons .btn {
      margin-left: 1rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      border: none;
      cursor: pointer;
      background: var(--glass-bg);
      color: #fff;
      transition: 0.3s;
      text-decoration: none;
      display: inline-block;
    }

    .auth-buttons .btn.accent {
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
      box-shadow: 0 0 15px var(--accent-secondary);
    }

    @media (max-width: 768px) {
      .layout-content {
        padding: 1rem;
      }
      .page-wrapper {
        max-width: 100%;
      }
    }
  `]
})
export class ResponsiveLayoutComponent {
  isLoggedIn = false;
  isLoginOrRegisterPage = false;

  constructor(private router: Router) {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.router.events.subscribe(() => {
      this.isLoginOrRegisterPage =
        this.router.url.includes('/login') || this.router.url.includes('/registro');
    });
  }

  goHome() { this.router.navigate(['/']); }
  goLogin() { this.router.navigate(['/login']); }
  goRegister() { this.router.navigate(['/registro']); }
  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }
}
