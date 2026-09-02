import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
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
  `,
  styles: [`
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
    .logo { font-weight: bold; font-size: 1.2rem; color: var(--accent-primary); }
    .auth-buttons .btn {
      margin-left: 1rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      border: none;
      cursor: pointer;
      background: var(--glass-bg);
      color: #fff;
      transition: 0.3s;
    }
    .auth-buttons .btn.accent {
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
      box-shadow: 0 0 15px var(--accent-secondary);
    }
  `]
})
export class NavbarComponent {
  isLoggedIn = false;
  isLoginOrRegisterPage = false;

  constructor(private router: Router) {
    // Detectar si hay token guardado
    this.isLoggedIn = !!localStorage.getItem('token');

    // Detectar si estamos en login o registro
    this.router.events.subscribe(() => {
      this.isLoginOrRegisterPage =
        this.router.url.includes('/login') || this.router.url.includes('/registro');
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  goRegister() {
    this.router.navigate(['/registro']);
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }
}
