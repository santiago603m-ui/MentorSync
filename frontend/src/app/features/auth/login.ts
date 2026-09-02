import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './authService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onLogin()" class="login-form">
      <h3 class="form-title">Accede a tu cuenta</h3>

      <input [(ngModel)]="email" name="email" placeholder="Correo electrónico" type="email" />
      <input [(ngModel)]="password" name="password" placeholder="Contraseña" type="password" />

      <div class="options">
        <label>
          <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
          Recordarme
        </label>
        <a href="#">¿Olvidaste tu contraseña?</a>
      </div>

      <button type="submit" class="login-btn">LOGIN</button>
    </form>
  `,
  styles: [`
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-title {
      margin-bottom: 1rem;
      color: var(--accent-secondary);
      text-shadow: 0 0 10px var(--accent-secondary);
    }

    input {
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--glass-border);
      background: var(--glass-bg);
      color: var(--accent-secondary);
      outline: none;
      font-size: 1rem;
      transition: 0.3s;
    }

    input::placeholder {
      color: var(--accent-primary);
    }

    input:focus {
      box-shadow: 0 0 10px var(--accent-secondary);
      border-color: var(--accent-secondary);
    }

    .options {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: var(--accent-secondary);
    }

    .options a {
      color: var(--accent-primary);
      text-decoration: none;
    }

    .options a:hover {
      text-decoration: underline;
    }

    .login-btn {
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
      border: none;
      border-radius: var(--radius-md);
      padding: 0.75rem;
      color: #fff;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 0 15px var(--accent-secondary);
      transition: 0.3s;
    }

    .login-btn:hover {
      box-shadow: 0 0 25px var(--accent-secondary);
      transform: scale(1.05);
    }
  `]
})
export class LoginFormComponent {
  email = '';
  password = '';
  rememberMe = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: response => {
        console.log('Login exitoso', response);
        localStorage.setItem('token', response.token);

        // 👇 Ahora redirige al HomePage
        this.router.navigate(['/']);
      },
      error: err => console.error('Error en login', err)
    });
  }
}
