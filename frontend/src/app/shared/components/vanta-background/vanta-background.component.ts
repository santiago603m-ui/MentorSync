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
    <div class="vanta-content" [class.solid-bg]="solidBg()">
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
    .vanta-content {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .vanta-content.solid-bg {
      background: #0B1020;
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
}
