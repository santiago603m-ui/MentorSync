import { Injectable } from '@angular/core';

/**
 * Tema fijo oscuro (Dark Mode).
 * Se eliminaron los modos claro y cyberpunk del sistema.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  mode(): 'dark' { return 'dark'; }
}
