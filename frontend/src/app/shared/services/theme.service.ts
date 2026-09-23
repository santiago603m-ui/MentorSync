import { Injectable } from '@angular/core';

/**
 * Tema fijo oscuro — se eliminó modo claro y cyberpunk por petición.
 * Se mantiene el servicio para no romper inyecciones existentes,
 * pero ya no hace toggle. Siempre retorna dark.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Para vanta-background y compatibilidad
  mode(): 'dark' { return 'dark'; }
  isLight(): boolean { return false; }
  isCyberpunk(): boolean { return false; }
  toggle(): void {}
  toggleMode(): void {}
}
