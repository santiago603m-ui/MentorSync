import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ViewChild,
  PLATFORM_ID,
  inject,
  signal,
  effect
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from '../../../layouts/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ThemeService } from '../../../shared/services/theme.service';

declare global {
  interface Window {
    THREE?: unknown;
    VANTA?: { WAVES: (opts: Record<string, unknown>) => { destroy: () => void } };
  }
}

const COLOR_POR_MODO = { dark: 0x2d0060, light: 0x8fb4dd } as const;

@Component({
  selector: 'app-vanta-background',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div #vantaRef class="vanta-bg" [class.hidden]="solidBg()" [class.is-ready]="vistaLista"></div>
    <div
      class="dot-bg"
      [class.visible]="solidBg()"
      data-aifx="dot-grid-wave"
      data-aifx-colors="#7b38f8,#3600ff"
      aria-hidden="true"
    ></div>
    <div class="vanta-content">
      <app-navbar></app-navbar>
      <main class="page-container">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .vanta-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-gradient, radial-gradient(circle at top left, #1B1035, #0B0715 70%));
      opacity: 0;
      transition: opacity 0.6s ease;
    }
    .vanta-bg.is-ready:not(.hidden) {
      opacity: 1;
    }
    .vanta-bg.hidden {
      opacity: 0 !important;
      visibility: hidden;
      pointer-events: none;
    }
    .dot-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0;
      transition: opacity 0.6s ease;
      pointer-events: none;
      background: #0B1020;
    }
    .dot-bg.visible {
      opacity: 1;
    }
    .vanta-content {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding-top: 5rem;
    }
  `],
})
export class VantaBackgroundComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('vantaRef', { static: true }) vantaRef!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private theme = inject(ThemeService);
  private router = inject(Router);
  private efectoVanta: { destroy: () => void } | null = null;
  private vantaListo = false;
  vistaLista = false;

  solidBg = signal(this.checkSolidBg());

  private checkSolidBg(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      const url = this.router.url.split('?')[0].split('#')[0];
      return url === '/' || url === '' || url.startsWith('/auth') || url.startsWith('/login') || url.startsWith('/registro');
    } catch {
      return false;
    }
  }

  constructor() {
    effect(() => {
      this.theme.mode();
      if (this.vantaListo) this.recrearEfecto();
    });
    effect(() => {
      // Reacciona a cambios de ruta (home/auth ↔ resto)
      const esSolido = this.solidBg();
      if (!this.vantaListo) return;
      if (esSolido) {
        this.efectoVanta?.destroy();
        this.efectoVanta = null;
        this.vantaRef.nativeElement.classList.remove('is-ready');
      } else {
        this.recrearEfecto();
        requestAnimationFrame(() => this.vantaRef.nativeElement.classList.add('is-ready'));
      }
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.solidBg.set(this.checkSolidBg());
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.solidBg.set(this.checkSolidBg());
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.vistaLista = true;
    this.cargarDotGridWave();

    // three.min.js y vanta.waves.min.js ya están en window gracias al "scripts" de angular.json.
    if (!window.VANTA?.WAVES) {
      console.error('[Vanta] window.VANTA.WAVES no existe — revisa el array "scripts" en angular.json');
      return;
    }

    this.vantaListo = true;
    this.crearEfecto();
    requestAnimationFrame(() => this.vantaRef.nativeElement.classList.add('is-ready'));
  }

  ngOnDestroy(): void {
    this.efectoVanta?.destroy();
    this.efectoVanta = null;
  }

  private crearEfecto(): void {
    if (!window.VANTA?.WAVES) return;
    if (this.solidBg()) return;
    this.efectoVanta = window.VANTA.WAVES({
      el: this.vantaRef.nativeElement,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x1b1035,
      shininess: 150.0,
      waveHeight: 40.0,
      waveSpeed: 0.55,
      zoom: 0.65,
    });
  }

  private recrearEfecto(): void {
    this.efectoVanta?.destroy();
    this.efectoVanta = null;
    if (this.solidBg()) return;
    this.crearEfecto();
  }

  /**
   * Carga el runtime del efecto Dot Grid Wave (cdn.aidesigner.ai) una sola vez.
   * El div [data-aifx="dot-grid-wave"] vive en este componente padre, que persiste
   * entre navegaciones — por eso el script solo necesita cargarse una vez para
   * toda la sesión; la visibilidad la controla la clase .visible según solidBg().
   */
  private cargarDotGridWave(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const SCRIPT_SRC = 'https://cdn.aidesigner.ai/effects/runtime/v1.js';
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.defer = true;
    document.body.appendChild(script);
  }
}