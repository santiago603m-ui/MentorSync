import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthRespuesta } from '../../../models/auth.model';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  private route = inject(ActivatedRoute);

  // Control de rotación 3D
  isFlipped = false;

  // === VARIABLES DE LOGIN ===
  emailLogin = '';
  contrasenaLogin = '';
  rememberMe = false;
  loginError = '';

  // === VARIABLES DE REGISTRO ===
  nombreRegistro = '';
  emailRegistro = '';
  contrasenaRegistro = '';
  confirmPassword = '';
  rol = 'aprendiz';
  registroError = '';
  registroExito = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Sincroniza la cara de la tarjeta según el queryParam ?mode=registro / ?mode=login
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'registro') {
        this.isFlipped = true;
      } else if (params['mode'] === 'login') {
        this.isFlipped = false;
      }
    });
  }

  // Intercambia las caras y limpia los mensajes de alerta
  toggleFlip(): void {
    this.isFlipped = !this.isFlipped;
    this.loginError = '';
    this.registroError = '';
    this.registroExito = '';
  }

  onLogin(): void {
    if (!this.emailLogin || !this.contrasenaLogin) {
      this.loginError = 'Por favor completa todos los campos.';
      return;
    }

    this.loginError = '';

    this.authService.login({ email: this.emailLogin, contraseña: this.contrasenaLogin }).subscribe({
      next: (response: AuthRespuesta) => {
        this.authService.guardarSesion(response);
        const rutaDestino = this.authService.rutaSegunRol(response.data.usuario.rol);
        this.router.navigate([rutaDestino]);
      },
      error: (err: any) => {
        console.error('Error en login:', err);
        this.loginError = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      }
    });
  }

  onRegister(): void {
    if (!this.nombreRegistro || !this.emailRegistro || !this.contrasenaRegistro) {
      this.registroError = 'Por favor completa todos los campos requeridos.';
      return;
    }

    if (this.contrasenaRegistro !== this.confirmPassword) {
      this.registroError = 'Las contraseñas no coinciden.';
      return;
    }

    this.registroError = '';

    this.authService.register({
      nombre: this.nombreRegistro,
      email: this.emailRegistro,
      contraseña: this.contrasenaRegistro,
      rol: this.rol
    }).subscribe({
      next: () => {
        this.registroExito = '¡Cuenta creada con éxito! Redirigiendo al login...';
        setTimeout(() => {
          this.emailLogin = this.emailRegistro;
          this.toggleFlip();
        }, 1500);
      },
      error: (err: any) => {
        console.error('Error en registro:', err);
        this.registroError = 'Error al registrar la cuenta. Inténtalo de nuevo.';
      }
    });
  }
}