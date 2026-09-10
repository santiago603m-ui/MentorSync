import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthRespuesta } from '../../../../models/auth.model';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onLogin()" class="login-form">
      <label class="field">
        <span class="field-label">Correo electrónico</span>
        <input [(ngModel)]="email" name="email" placeholder="tucorreo@ejemplo.com" type="email" required />
      </label>

      <label class="field">
        <span class="field-label">Contraseña</span>
        <input [(ngModel)]="contrasena" name="contrasena" placeholder="••••••••" type="password" required />
      </label>

      <div class="options">
        <label class="checkbox">
          <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" /> Recordarme
        </label>
        <a href="#">¿Olvidaste tu contraseña?</a>
      </div>

      <p *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</p>
      <button type="submit" class="submit-btn">Iniciar sesión</button>
    </form>
  `,
  styles: [`
    .login-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
    input[type="email"], input[type="password"] {
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
    .error-msg { color: #ff6b6b; font-size: 0.85rem; margin: -0.5rem 0 0; }
    .options { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-secondary); }
    .checkbox { display: flex; align-items: center; gap: 0.4rem; }
    .options a { color: var(--accent-cyan); text-decoration: none; }
    .options a:hover { text-decoration: underline; }
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
    .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(139,107,255,0.3);
    }
    .error-msg { color: var(--danger); font-size: 0.85rem; text-align: center; }
  `]
})
export class LoginFormComponent {
  email = '';
  contrasena = '';
  rememberMe = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.errorMessage = '';

    this.authService.login({ email: this.email, contraseña: this.contrasena }).subscribe({
      next: (response: AuthRespuesta) => {
        // Guardar sesión (token, rol y datos del usuario)
        this.authService.guardarSesion(response);

        // Redirigir según el rol definido en el login
        this.router.navigate([this.authService.rutaSegunRol(response.data.usuario.rol)]);
      },
      error: (err: any) => {
        console.error('Error en login', err);
        this.errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      }
    });
  }
}
