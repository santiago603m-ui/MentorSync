import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthRespuesta } from '../../models/auth.model';
import { VantaBackgroundComponent } from '../../shared/components/vanta-background/vanta-background.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  // ReactiveFormsModule no se usaba: los formularios son template-driven.
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private redireccionTimer?: ReturnType<typeof setTimeout>;

  // Control de rotación 3D
  isFlipped = false;

  // === LOGIN ===
  emailLogin = '';
  contrasenaLogin = '';
  rememberMe = false;
  loginError = '';
  cargandoLogin = false;

  // === REGISTRO ===
  nombreRegistro = '';
  emailRegistro = '';
  contrasenaRegistro = '';
  confirmPassword = '';
  rol = 'aprendiz';
  registroError = '';
  registroExito = '';
  cargandoRegistro = false;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['mode'] === 'registro') {
          this.isFlipped = true;
        } else if (params['mode'] === 'login') {
          this.isFlipped = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.redireccionTimer) clearTimeout(this.redireccionTimer);
  }

  toggleFlip(): void {
    this.isFlipped = !this.isFlipped;
    this.loginError = '';
    this.registroError = '';
    this.registroExito = '';
  }

  onLogin(): void {
    if (this.cargandoLogin) return;

    if (!this.emailLogin || !this.contrasenaLogin) {
      this.loginError = 'Completa el correo y la contraseña.';
      return;
    }

    this.loginError = '';
    this.cargandoLogin = true;

    this.authService
      .login({ email: this.emailLogin, contraseña: this.contrasenaLogin })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AuthRespuesta) => {
          this.cargandoLogin = false;
          this.authService.guardarSesion(response);
          const rutaDestino = this.authService.rutaSegunRol(response.data.usuario.rol);
          this.router.navigate([rutaDestino]);
        },
        error: (err: unknown) => {
          this.cargandoLogin = false;
          console.error('Error en login:', err);
          this.loginError = 'Correo o contraseña incorrectos. Revísalos e intenta de nuevo.';
        }
      });
  }

  onRegister(): void {
    if (this.cargandoRegistro) return;

    if (!this.nombreRegistro || !this.emailRegistro || !this.contrasenaRegistro) {
      this.registroError = 'Completa todos los campos requeridos.';
      return;
    }

    if (this.contrasenaRegistro.length < 8) {
      this.registroError = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (this.contrasenaRegistro !== this.confirmPassword) {
      this.registroError = 'Las contraseñas no coinciden.';
      return;
    }

    this.registroError = '';
    this.cargandoRegistro = true;

    this.authService
      .register({
        nombre: this.nombreRegistro,
        email: this.emailRegistro,
        contraseña: this.contrasenaRegistro,
        rol: this.rol
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cargandoRegistro = false;
          this.registroExito = 'Cuenta creada. Te llevamos al inicio de sesión…';
          this.redireccionTimer = setTimeout(() => {
            this.emailLogin = this.emailRegistro;
            this.contrasenaRegistro = '';
            this.confirmPassword = '';
            this.toggleFlip();
          }, 1500);
        },
        error: (err: unknown) => {
          this.cargandoRegistro = false;
          console.error('Error en registro:', err);
          this.registroError = 'No se pudo crear la cuenta. Intenta de nuevo.';
        }
      });
  }
}