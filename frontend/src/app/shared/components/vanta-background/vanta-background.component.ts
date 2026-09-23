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
    <div #vantaRef class="vanta-bg" [class.hidden]="solidBg()" [class.is-ready]="vistaLista"></div>
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
      if (this.vistaLista) void this.recrearEfecto();
    });
    effect(() => {
      // Reacciona a cambios de ruta (home/auth ↔ resto)
      this.solidBg();
      if (!this.vistaLista) return;
      if (this.solidBg()) {
        this.efectoVanta?.destroy();
        this.efectoVanta = null;
        this.vantaRef.nativeElement.classList.remove('is-ready');
      } else {
        void this.recrearEfecto();
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

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.THREE = await import('three');
    const { default: WAVES } = await import('vanta/dist/vanta.waves.min');
    this.WAVES = WAVES as FabricaVanta;

    this.vistaLista = true;
    this.crearEfecto();
    requestAnimationFrame(() => this.vantaRef.nativeElement.classList.add('is-ready'));
    this.iniciarDotGrid();
  }

  ngOnDestroy(): void {
    this.efectoVanta?.destroy();
    this.efectoVanta = null;
  }

  private crearEfecto(): void {
    if (!this.WAVES) return;
    if (this.solidBg()) return;
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

  private async recrearEfecto(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.efectoVanta?.destroy();
    this.efectoVanta = null;
    if (this.solidBg()) return;
    this.crearEfecto();
  }

  private iniciarDotGrid(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.dotCanvas?.nativeElement;
    if (!canvas) {
      // Reintenta si el ViewChild aún no está disponible
      setTimeout(() => this.iniciarDotGrid(), 100);
      return;
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const bg = '#0B1020';
    const c1 = { r: 0x7b, g: 0x38, b: 0xf8 }; // #7b38f8
    const c2 = { r: 0x36, g: 0x00, b: 0xff }; // #3600ff
    let raf = 0;
    let t = 0;
    let mouseX = 0.5, mouseY = 0.5, targetX = 0.5, targetY = 0.5;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth;
      targetY = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove);

    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      mouseX = lerp(mouseX, targetX, 0.06);
      mouseY = lerp(mouseY, targetY, 0.06);
      t += 0.016 * 0.5;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const spacing = 22;
      const dotBase = spacing * 0.35;
      const waveScale = 1.2;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let y = -1; y < rows; y++) {
        for (let x = -1; x < cols; x++) {
          const px = x * spacing + (y % 2 ? spacing / 2 : 0);
          const py = y * spacing;
          const wave = Math.sin((px * 0.012 + py * 0.012) * waveScale - t * 2.2) * 0.5 + 0.5;
          const distMouse = Math.hypot((px / w) - mouseX, (py / h) - mouseY);
          const mouseInfluence = Math.max(0, 1 - distMouse * 2.2) * 0.22;
          const k = Math.min(1, Math.max(0, wave + mouseInfluence));
          const r = dotBase * (0.45 + k * 0.55);
          const a = 0.10 + k * 0.38;
          const rr = Math.round(lerp(c2.r, c1.r, k));
          const gg = Math.round(lerp(c2.g, c1.g, k));
          const bb = Math.round(lerp(c2.b, c1.b, k));
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${a})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
  }
}
