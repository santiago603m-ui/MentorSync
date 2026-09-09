// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const rolesPermitidos = route.data?.['roles'] as string[];
  
  if (rolesPermitidos && authService.rolCoincide(rolesPermitidos)) {
    return true;
  }

  // Redirige a la vista correspondiente según su rol si intenta entrar a una ruta no permitida
  const rutaCorrecta = authService.rutaSegunRol(authService.getRol());
  return router.createUrlTree([rutaCorrecta]);
};