import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NodePoint {
  x: number;
  y: number;
  z: number;
  transform: string;
}

interface EdgeLine {
  width: number;
  transform: string;
}

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css'],
})
export class SplashScreenComponent implements OnInit {
  visible = signal(true);
  fading = signal(false);
  exploding = signal(false);

  readonly nodes: NodePoint[] = [];
  readonly edges: EdgeLine[] = [];

  private readonly storageKey = 'mentorsync_splash_shown';
  private readonly displayMs = 5000;
  private readonly fadeMs = 700;
  private readonly nodeCount = 9;
  private readonly sphereRadius = 78;

  constructor() {
    this.generarEsferaDeNodos();
  }

  ngOnInit(): void {
    const forzar = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('forceSplash');
    const yaSeMostro = localStorage.getItem(this.storageKey);
    if (!forzar && yaSeMostro) {
      const ts = Number(yaSeMostro);
      if (!isNaN(ts) && Date.now() - ts < 30 * 60 * 1000) {
        this.visible.set(false);
        return;
      }
    }
    if (forzar) {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem('splash_just_shown');
    }

    setTimeout(() => {
      // Destrucción en partículas
      this.exploding.set(true);
      this.fading.set(true);
      localStorage.setItem(this.storageKey, Date.now().toString());
      // Marca para que el hero sepa que viene de splash y debe re-ensamblar
      sessionStorage.setItem('splash_just_shown', Date.now().toString());
      setTimeout(() => this.visible.set(false), this.fadeMs);
    }, this.displayMs);
  }

  transformNodo(n: NodePoint): string {
    if (!this.exploding()) return n.transform;
    // Explosión: multiplica distancia x2.8 y desvanece
    return `translate3d(${n.x * 2.8}px, ${n.y * 2.8}px, ${n.z * 2.8}px) scale(0)`;
  }

  private generarEsferaDeNodos(): void {
    for (let i = 0; i < this.nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / this.nodeCount);
      const theta = Math.sqrt(this.nodeCount * Math.PI) * phi;

      const x = this.sphereRadius * Math.cos(theta) * Math.sin(phi);
      const y = this.sphereRadius * Math.sin(theta) * Math.sin(phi);
      const z = this.sphereRadius * Math.cos(phi);

      this.nodes.push({
        x, y, z,
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
      });

      const largo = Math.sqrt(x * x + y * y + z * z);
      const rotacionY = (Math.atan2(x, z) * 180) / Math.PI;
      const rotacionX = (-Math.atan2(y, Math.sqrt(x * x + z * z)) * 180) / Math.PI;

      this.edges.push({
        width: largo,
        transform: `rotateY(${rotacionY}deg) rotateX(${rotacionX}deg)`,
      });
    }
  }
}
