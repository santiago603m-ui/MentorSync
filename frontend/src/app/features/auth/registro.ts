import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onRegister()" class="register-form">
      <label class="field">
        <span class="field-label">Nombre completo</span>
        <input [(ngModel)]="name" name="name" placeholder="Tu nombre" type="text" required />
      </label>

      <label class="field">
        <span class="field-label">Correo electrónico</span>
        <input [(ngModel)]="email" name="email" placeholder="tucorreo@ejemplo.com" type="email" required />
      </label>

      <div class="field">
        <span class="field-label">Quiero unirme como</span>
        <div class="role-select">
          <button type="button" [class.active]="role === 'Aprendiz'" (click)="role = 'Aprendiz'">Aprendiz</button>
          <button type="button" [class.active]="role === 'Mentor'" (click)="role = 'Mentor'">Mentor</button>
          <button type="button" [class.active]="role === 'Administrador'" (click)="role = 'Administrador'">Admin</button>
        </div>
      </div>

      <label class="field">
        <span class="field-label">Contraseña</span>
        <input [(ngModel)]="password" name="password" placeholder="Mínimo 8 caracteres" type="password" required minlength="8" />
      </label>

      <label class="field">
        <span class="field-label">Repite tu contraseña</span>
        <input [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="••••••••" type="password" required />
      </label>

      <p *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</p>

      <button type="submit" class="submit-btn">Crear cuenta</button>
    </form>
  `,
  styles: [`
    .register-form { display: flex; flex-direction: column; gap: 1.1rem; }

    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }

    input[type="text"], input[type="email"], input[type="password"] {
      padding: 0.75rem 0.9rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--surface-1);
      color: var(--text-primary);
      outline: none;
      font-size: 0.95rem;
      transition: border-color 0.2s ease;
    }
    input::placeholder { color: var(--text-muted); }
    input:focus { border-color: var(--accent-cyan); }

    .role-select { display: flex; gap: 0.5rem; }
    .role-select button {
      flex: 1;
      padding: 0.6rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: var(--surface-1);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .role-select button.active {
      background: var(--accent-gradient);
      color: #08101c;
      border-color: transparent;
    }

    .submit-btn {
      background: var(--accent-gradient);
      border: none;
      border-radius: var(--radius-sm);
      padding: 0.8rem;
      color: #08101c;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(139,107,255,0.3); }

    .error-msg { color: var(--danger); font-size: 0.85rem; text-align: center; }
  `]
})
export class RegisterFormComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'Aprendiz';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.errorMessage = '';

    this.authService.register({
      nombre: this.name,
      correo: this.email,
      contrasena: this.password,
      rol: this.role
    }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => {
        console.error('Error en registro', err);
        this.errorMessage = 'Error en el registro. Intenta nuevamente.';
      }
    });
  }
}
