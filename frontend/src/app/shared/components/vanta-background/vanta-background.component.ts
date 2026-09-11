import { 
  Component, 
  ElementRef, 
  AfterViewInit, 
  OnDestroy, 
  ViewChild, 
  PLATFORM_ID, 
  inject 
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../layouts/navbar/navbar.component'; // Verifica la ruta de importación

@Component({
  selector: 'app-vanta-background',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div #vantaRef class="vanta-bg"></div>
    <div class="vanta-content">
      <app-navbar></app-navbar>
      <main class="page-container">
        <router-outlet></router-outlet>
      </main>
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
    .vanta-bg.is-ready {
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
      padding-top: 5rem; /* Evita que el Navbar solape los formularios */
    }
  `],
})
export class VantaBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('vantaRef', { static: true }) vantaRef!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private efectoVanta: { destroy: () => void } | null = null;

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.vantaRef.nativeElement;

    const THREE = await import('three');
    const { default: WAVES } = await import('vanta/dist/vanta.waves.min');

    this.efectoVanta = WAVES({
      el,
      THREE,
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

    requestAnimationFrame(() => el.classList.add('is-ready'));
  }

  ngOnDestroy(): void {
    this.efectoVanta?.destroy();
  }
}