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

type FabricaVanta = (opciones: Record<string, unknown>) => { destroy: () => void };

const COLOR_POR_MODO = { dark: 0x1b1035, light: 0x8fb4dd } as const;

@Component({
  selector: 'app-vanta-background',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div #vantaRef class="vanta-bg" [class.hidden]="solidBg()"></div>
    <canvas #dotCanvas class="dot-bg" [class.visible]="solidBg()"></canvas>
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
  @ViewChild('dotCanvas') dotCanvas!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private theme = inject(ThemeService);
  private router = inject(Router);
  private efectoVanta: { destroy: () => void } | null = null;
  private THREE: unknown = null;
  private WAVES: FabricaVanta | null = null;
  vistaLista = false;

  // Señal reactiva: true = home/auth (fondo sólido + puntos), false = resto (Vanta Waves)
  solidBg = signal(false);

  constructor() {
    // Sincroniza solidBg con cada NavigationEnd (navegaciones client-side)
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const url = this.router.url.split('?')[0].split('#')[0];
      const esHomeOAuth = url === '/' || url === '' || url.startsWith('/auth') || url.startsWith('/login') || url.startsWith('/registro');
      this.solidBg.set(esHomeOAuth);
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Estado inicial inmediato (el effect del constructor ya lo hizo, pero por si acaso)
    this.solidBg.set(this.checkSolidBg());
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.solidBg.set(this.checkSolidBg());
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.THREE = await import('three');
    const { default: WAVES } = await import('vanta/dist/vanta.waves.min');
    this.WAVES = WAVES as FabricaVanta;

    this.vistaLista = true;

    // Inicializar efecto según la ruta actual
    this.inicializarFondo();

    // Marcar is-ready después de un frame para que los estilos apliquen
    requestAnimationFrame(() => this.vantaRef.nativeElement.classList.add('is-ready'));

    // Cargar el runtime del dot-grid-wave (solo una vez por sesión)
    this.cargarDotGridWave();
  }

  ngOnDestroy(): void {
    this.efectoVanta?.destroy();
    this.efectoVanta = null;
  }

  /** Decide la ruta: true = home/auth (fondo sólido + puntos), false = resto (Vanta Waves) */
  private checkSolidBg(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      const url = this.router.url.split('?')[0].split('#')[0];
      return url === '/' || url === '' || url.startsWith('/auth') || url.startsWith('/login') || url.startsWith('/registro');
    } catch {
      return false;
    }
  }

  /** Carga el script del runtime una sola vez (cdn.aidesigner.ai) */
  private cargarDotGridWave(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const SCRIPT_SRC = 'https://cdn.aidesigner.ai/effects/runtime/v1.js';
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.defer = true;
    document.body.appendChild(script);
  }

  /** Inicializa el fondo según la ruta actual */
  private inicializarFondo(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const esHomeOAuth = this.solidBg();

    if (esHomeOAuth) {
      // Home / auth: usar dot-grid-wave (canvas) + ocultar Vanta
      if (this.WAVES) {
        this.efectoVanta?.destroy();
        this.efectoVanta = null;
        this.vantaRef.nativeElement.classList.remove('is-ready');
      }
      // El canvas .dot-bg ya tiene [class.visible]="solidBg()" en el template
      // No es necesario destruir el canvas, solo controlar su visibilidad
    } else {
      // Resto de páginas: usar Vanta Waves, ocultar dot-bg
      // Ocultar el canvas de puntos
      if (this.dotCanvas) {
        this.dotCanvas.nativeElement.style.opacity = '0';
      }
      // Crear efecto Vanta
      if (this.WAVES && !this.solidBg()) {
        // Destroy any previous efectoVanta
        this.efectoVanta?.destroy();
        this.efectoVanta = null;

        // Asegurar que vanta-bg esté visible para Vanta
        this.vantaRef.nativeElement.classList.add('is-ready');
        this.vantaRef.nativeElement.classList.remove('hidden');

        this.efectoVanta = this.WAVES({
          el: this.vantaRef.nativeElement,
          THREE: this.THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: COLOR_POR_MODO[this.theme.mode()],
          shininess: 150.0,
          waveHeight: 40.0,
          waveSpeed: 0.55,
          zoom: 0.65,
        });
      }
    }
  }
}