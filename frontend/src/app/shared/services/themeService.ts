import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mentorsync-theme';
const CYBERPUNK_CLASS = 'theme-cyberpunk';

/**
 * Maneja el tema visual global de la app.
 * El tema por defecto es el dashboard oscuro (violeta/cian).
 * El tema "cyberpunk" sobreescribe las mismas variables CSS en :root,
 * así que no hay que tocar ningún componente: todo lo que usa
 * var(--accent-cyan), var(--accent-violet), etc. cambia solo.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  isCyberpunk = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    this.apply(saved === 'cyberpunk');
  }

  toggle() {
    this.apply(!this.isCyberpunk());
  }

  private apply(cyberpunk: boolean) {
    this.isCyberpunk.set(cyberpunk);
    if (typeof document === 'undefined') return;
    document.body.classList.toggle(CYBERPUNK_CLASS, cyberpunk);
    window.localStorage.setItem(STORAGE_KEY, cyberpunk ? 'cyberpunk' : 'default');
  }
}
