import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './authService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onRegister()" class="register-form">
      <h3 class="form-title">Crea tu cuenta</h3>

      <input [(ngModel)]="name" name="name" placeholder="Nombre completo" type="text" required />
      <input [(ngModel)]="email" name="email" placeholder="Correo electrónico" type="email" required />

      <!-- Selección dinámica de rol -->
      <div class="role-select">
        <button type="button"
                [class.active]="role === 'Aprendiz'"
                (click)="role = 'Aprendiz'">Aprendiz</button>
        <button type="button"
                [class.active]="role === 'Mentor'"
                (click)="role = 'Mentor'">Mentor</button>
        <button type="button"
                [class.active]="role === 'Administrador'"
                (click)="role = 'Administrador'">Administrador</button>
      </div>

      <input [(ngModel)]="password" name="password" placeholder="Contraseña (mínimo 8 caracteres)" type="password" required minlength="8" />
      <input [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Repite tu contraseña" type="password" required />

      <!-- Mensaje de error -->
      <p *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</p>

      <button type="submit" class="register-btn">Crear cuenta</button>
    </form>
  `,
  styles: [`
    .register-form {
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

    .role-select {
      display: flex;
      justify-content: space-around;
      margin: 1rem 0;
    }

    .role-select button {
      flex: 1;
      margin: 0 0.5rem;
      padding: 0.75rem;
      border: none;
      border-radius: var(--radius-md);
      background: var(--glass-bg);
      color: var(--accent-primary);
      font-weight: bold;
      cursor: pointer;
      transition: 0.3s;
    }

    .role-select button.active {
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
      color: #fff;
      box-shadow: 0 0 15px var(--accent-secondary);
    }

    .register-btn {
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

    .register-btn:hover {
      box-shadow: 0 0 25px var(--accent-secondary);
      transform: scale(1.05);
    }

    .error-msg {
      color: #ff4d4d;
      font-size: 0.85rem;
      text-align: center;
    }
  `]
})
export class RegisterFormComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'Aprendiz'; // 👈 valor por defecto
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.errorMessage = '';

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: response => {
        console.log('Registro exitoso', response);
        this.router.navigate(['/login']); // 👈 redirige al login después de registrarse
      },
      error: err => {
        console.error('Error en registro', err);
        this.errorMessage = 'Error en el registro. Intenta nuevamente.';
      }
    });
  }
}
