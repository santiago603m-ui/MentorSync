import { Component, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';

import { NavbarComponent } from '../../layouts/navbar/navbar.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePage implements AfterViewInit, OnDestroy {
  private limpiezas: (() => void)[] = [];

  // Hero particle logo (re-ensamblaje desde el splash)
  heroNodes: { x: number; y: number; z: number; transform: string }[] = [];
  heroEdges: { width: number; transform: string }[] = [];
  heroAssembled = signal(false);
  mostrarHeroLogo = signal(false);

  constructor(private router: Router) {
    this.generarHeroEsfera();
  }

  private generarHeroEsfera(): void {
    const count = 9;
    const radius = 62;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      this.heroNodes.push({ x, y, z, transform: `translate3d(${x}px, ${y}px, ${z}px)` });
      const largo = Math.sqrt(x * x + y * y + z * z);
      const rotY = (Math.atan2(x, z) * 180) / Math.PI;
      const rotX = (-Math.atan2(y, Math.sqrt(x * x + z * z)) * 180) / Math.PI;
      this.heroEdges.push({ width: largo, transform: `rotateY(${rotY}deg) rotateX(${rotX}deg)` });
    }
  }

  private iniciarHeroParticulas(reducido: boolean): void {
    if (reducido) {
      this.mostrarHeroLogo.set(true);
      this.heroAssembled.set(true);
      return;
    }

    const check = () => sessionStorage.getItem('splash_just_shown');
    const forzar = new URLSearchParams(window.location.search).has('forceSplash');

    // Si no hay splash previo y no es forzado, muestra logo estático ya ensamblado (sin animación)
    // Si hay splash activo o forzado, haz la animación de explosión -> re-ensamblaje
    const splashShown = localStorage.getItem('mentorsync_splash_shown');
    const haceCuanto = splashShown ? Date.now() - Number(splashShown) : Infinity;
    const vieneDeSplash = !!check() || forzar || haceCuanto < 8000;

    if (!vieneDeSplash && !forzar) {
      // Entrada directa sin splash: muestra logo ya formado, sin efecto
      this.mostrarHeroLogo.set(true);
      this.heroAssembled.set(true);
      return;
    }

    // Viene de splash: empieza explotado, luego pum
    this.mostrarHeroLogo.set(true);
    this.heroAssembled.set(false);

    // Si el splash aún está visible (5s), espera a que explote y luego ensambla
    const esperar = check() ? 700 : 100;
    setTimeout(() => this.heroAssembled.set(true), esperar);

    // Polling por si el splash se marca después (home ya montado antes del fin del splash)
    let intentos = 0;
    const poll = setInterval(() => {
      if (check() && !this.heroAssembled()) {
        this.heroAssembled.set(true);
        clearInterval(poll);
      }
      if (++intentos > 30) clearInterval(poll);
    }, 200);
    this.limpiezas.push(() => clearInterval(poll));

    if (check()) setTimeout(() => sessionStorage.removeItem('splash_just_shown'), 6000);
  }

  private async iniciarTimelineAnime(reducido: boolean): Promise<void> {
    if (reducido) {
      document.querySelectorAll<HTMLElement>('.how-it-works .step').forEach(el => el.classList.add('visible'));
      return;
    }
    const section = document.querySelector<HTMLElement>('.how-it-works');
    if (!section) return;

    try {
      const mod: any = await import('animejs');
      const animate = mod.animate ?? mod.default?.animate;
      if (!animate) throw new Error('animate no encontrado');

      // Estado inicial ya está en CSS (opacity 0, translateY 30px), pero aseguramos que no tenga .visible
      const steps = section.querySelectorAll<HTMLElement>('.step');
      steps.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
      });

      // Cada card se anima cuando entra en viewport — efecto de carga progresiva al hacer scroll
      steps.forEach((el) => {
        const obs = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              animate(el, {
                y: [24, 0],
                opacity: [0, 1],
                scale: [0.96, 1],
                duration: 700,
                ease: 'outExpo',
              } as any);
              // Limpia el transform inline al terminar para que el hover siga funcionando
              setTimeout(() => {
                el.style.opacity = '';
                el.style.transform = '';
                el.classList.add('visible');
              }, 750);
              obs.disconnect();
            }
          },
          { threshold: 0.22, rootMargin: '0px 0px -8% 0px' }
        );
        obs.observe(el);
        this.limpiezas.push(() => obs.disconnect());
      });
    } catch (e) {
      console.warn('anime Timeline no disponible', e);
      section.querySelectorAll<HTMLElement>('.step').forEach(el => el.classList.add('visible'));
    }
  }

 private cargarDotGridWave(reducido: boolean): void {
  if (typeof document === 'undefined') return;

  // Oculta Vanta mientras estemos en Home — este efecto lo reemplaza aquí
  const vantaBg = document.querySelector<HTMLElement>('.vanta-bg');
  if (vantaBg) vantaBg.style.opacity = '0';
  this.limpiezas.push(() => {
    if (vantaBg) vantaBg.style.opacity = ''; // al salir de Home, Vanta vuelve
  });

  if (reducido) return; // reduced motion: deja solo el fondo estático, sin script

  const SCRIPT_SRC = 'https://cdn.aidesigner.ai/effects/runtime/v1.js';
  // Quita una carga previa (si volviste a entrar a Home) para forzar reinicialización
  document.querySelectorAll(`script[src="${SCRIPT_SRC}"]`).forEach(s => s.remove());

  const script = document.createElement('script');
  script.src = SCRIPT_SRC;
  script.defer = true;
  document.body.appendChild(script);
  this.limpiezas.push(() => script.remove());
}

  heroNodeTransform(n: { x: number; y: number; z: number; transform: string }): string {
    if (this.heroAssembled()) return n.transform;
    return `translate3d(${n.x * 3.2}px, ${n.y * 3.2}px, ${n.z * 3.2}px) scale(0)`;
  }

  ngOnDestroy(): void {
    this.limpiezas.forEach(fn => fn());
    this.limpiezas = [];
  }

  async ngAfterViewInit(): Promise<void> {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Dot Grid Wave — solo home, adaptado a Vanta
    this.cargarDotGridWave(reducedMotion);

    // Hero re-ensamblaje: si viene del splash, espera a que explote y haz pum
    this.iniciarHeroParticulas(reducedMotion);

    // Reveals + contadores + spotlights: siempre activos (con reduced motion quedan estáticos)
    this.iniciarScrollFx(reducedMotion);

    // Timeline "Así funciona" con anime.js Timeline (como en la doc de animejs)
    this.iniciarTimelineAnime(reducedMotion);

    if (reducedMotion) return; // todo queda visible y estático

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.35 })
      .from('.hero-actions > *', { opacity: 0, y: 30, scale: 0.85, stagger: 0.08, duration: 0.35, ease: 'back.out(1.7)' }, '-=0.15')
      .from('.mentor-strip', { opacity: 0, y: 20, duration: 0.3 }, '-=0.1');

    // Efecto draw-on del título con anime.js (import dinámico: solo corre en navegador)
    const { animate, svg, stagger, createTimeline } = await import('animejs');

    const texto = document.querySelector<SVGTextElement>('.brand-draw-text');
    if (texto) {
      const largo = texto.getComputedTextLength();
      texto.style.strokeDasharray = `${largo}`;
      texto.style.strokeDashoffset = `${largo}`;
      texto.style.fillOpacity = '0';

      // Loop: dibujar trazo → rellenar → pausa → quitar relleno → borrar trazo
      const ciclo = createTimeline({ loop: true });
      ciclo
        .add(texto, { strokeDashoffset: [largo, 0], ease: 'inOutQuad', duration: 1800 })
        .add(texto, { fillOpacity: [0, 1], ease: 'linear', duration: 800 }, '-=400')
        .add(texto, { fillOpacity: [1, 0], ease: 'linear', duration: 800 }, '+=1400')
        .add(texto, { strokeDashoffset: [0, largo], ease: 'inOutQuad', duration: 1400 }, '-=400');
    }

    animate(svg.createDrawable('.draw-line'), {
      draw: ['0 0', '0 1', '1 1'],
      ease: 'inOutQuad',
      duration: 2000,
      delay: stagger(100),
      loop: true
    });

    this.iniciarInteractividad();
    this.iniciarEfectosScroll();
  }

  // Spotlight + tilt 3D + máquina de escribir. Todo con limpieza en ngOnDestroy.
  private iniciarInteractividad(): void {    const hero = document.querySelector<HTMLElement>('.hero-brand');
    const envoltura = document.querySelector('.brand-draw-wrap');
    const punto = document.querySelector('.hero-spotlight');

    if (hero && envoltura && punto) {
      gsap.set(punto, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: 220 });
      gsap.set(envoltura, { transformPerspective: 1100 });

      const moverX = gsap.quickTo(punto, 'x', { duration: 0.5, ease: 'power3' });
      const moverY = gsap.quickTo(punto, 'y', { duration: 0.5, ease: 'power3' });
      const rotarY = gsap.quickTo(envoltura, 'rotationY', { duration: 0.6, ease: 'power3' });
      const rotarX = gsap.quickTo(envoltura, 'rotationX', { duration: 0.6, ease: 'power3' });

      const alMover = (evento: MouseEvent) => {
        const rect = hero.getBoundingClientRect();
        const x = evento.clientX - rect.left;
        const y = evento.clientY - rect.top;
        moverX(x);
        moverY(y);
        rotarY(gsap.utils.mapRange(0, rect.width, -7, 7, x));
        rotarX(gsap.utils.mapRange(0, rect.height, 5, -5, y));
      };
      const alSalir = () => { rotarX(0); rotarY(0); };

      hero.addEventListener('mousemove', alMover);
      hero.addEventListener('mouseleave', alSalir);
      this.limpiezas.push(() => {
        hero.removeEventListener('mousemove', alMover);
        hero.removeEventListener('mouseleave', alSalir);
      });
    }

    const destino = document.querySelector('.typer-word');
    if (destino) {
      const palabras = ['programación', 'Angular', 'Python', 'bases de datos', 'IA aplicada'];
      let indicePalabra = 0;
      let indiceLetra = 0;
      let borrando = false;
      let temporizador: ReturnType<typeof setTimeout>;

      const paso = () => {
        const palabra = palabras[indicePalabra];
        let espera = 90;

        if (!borrando) {
          indiceLetra++;
          destino.textContent = palabra.slice(0, indiceLetra);
          if (indiceLetra === palabra.length) {
            borrando = true;
            espera = 1500;
          }
        } else {
          indiceLetra--;
          destino.textContent = palabra.slice(0, indiceLetra);
          espera = 40;
          if (indiceLetra === 0) {
            borrando = false;
            indicePalabra = (indicePalabra + 1) % palabras.length;
            espera = 350;
          }
        }

        temporizador = setTimeout(paso, espera);
      };

      paso();
      this.limpiezas.push(() => clearTimeout(temporizador));
    }
  }

  // Reveal on scroll + contadores + spotlight de las bento cards
  // NOTA: los .step del timeline NO entran aquí — los maneja iniciarTimelineAnime con anime.js
  private iniciarScrollFx(reducido: boolean): void {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (!entrada.isIntersecting) return;
        const el = entrada.target as HTMLElement;
        el.classList.add('visible');
        el.querySelectorAll<HTMLElement>('.stat-num[data-count]').forEach(n => this.animarContador(n, reducido));
        if (el.classList.contains('stat-num')) this.animarContador(el, reducido);
        observador.unobserve(el);
      });
    }, { threshold: 0.15 });

    document.querySelectorAll<HTMLElement>('.reveal:not(.step):not(.timeline)').forEach(el => observador.observe(el));
    // Los títulos y contenedores del timeline sí se revelan, pero no los steps individuales
    document.querySelectorAll<HTMLElement>('.how-it-works.reveal, .diff-section .reveal:not(.step), .final-cta-inner.reveal, .stats-bar.reveal').forEach(el => observador.observe(el));
    this.limpiezas.push(() => observador.disconnect());

    document.querySelectorAll<HTMLElement>('.diff-card.spot').forEach(card => {
      const alMover = (evento: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${evento.clientX - rect.left}px`);
        card.style.setProperty('--my', `${evento.clientY - rect.top}px`);
      };
      card.addEventListener('mousemove', alMover);
      this.limpiezas.push(() => card.removeEventListener('mousemove', alMover));
    });
  }

  private animarContador(nodo: HTMLElement, reducido: boolean): void {    if (nodo.dataset['hecho']) return;
    nodo.dataset['hecho'] = '1';

    const meta = Number(nodo.dataset['count'] || 0);
    const sufijo = nodo.dataset['suffix'] || '';
    const formatear = (valor: number) => `${Math.round(valor).toLocaleString('es-CO')}${sufijo}`;

    if (reducido) {
      nodo.textContent = formatear(meta);
      return;
    }

    const estado = { valor: 0 };
    gsap.to(estado, {
      valor: meta,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => { nodo.textContent = formatear(estado.valor); }
    });
  }

  // Botones magnéticos + tilt 3D en bento + progreso atado al scroll + parallax del hero
  private iniciarEfectosScroll(): void {
    // 1. Botones magnéticos
    document.querySelectorAll<HTMLElement>('.cta-primary').forEach(boton => {
      const imanX = gsap.quickTo(boton, 'x', { duration: 0.4, ease: 'power3' });
      const imanY = gsap.quickTo(boton, 'y', { duration: 0.4, ease: 'power3' });

      const atraer = (evento: MouseEvent) => {
        const rect = boton.getBoundingClientRect();
        imanX((evento.clientX - (rect.left + rect.width / 2)) * 0.3);
        imanY((evento.clientY - (rect.top + rect.height / 2)) * 0.3);
      };
      const soltar = () => gsap.to(boton, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });

      boton.addEventListener('mousemove', atraer);
      boton.addEventListener('mouseleave', soltar);
      this.limpiezas.push(() => {
        boton.removeEventListener('mousemove', atraer);
        boton.removeEventListener('mouseleave', soltar);
      });
    });

    // 2. Tilt 3D en las bento cards
    document.querySelectorAll<HTMLElement>('.diff-card.spot').forEach(card => {
      card.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
      gsap.set(card, { transformPerspective: 900 });
      const rotarX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      const rotarY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });

      const inclinar = (evento: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        rotarY(gsap.utils.mapRange(0, rect.width, -6, 6, evento.clientX - rect.left));
        rotarX(gsap.utils.mapRange(0, rect.height, 6, -6, evento.clientY - rect.top));
      };
      const enderezar = () => { rotarX(0); rotarY(0); };

      card.addEventListener('mousemove', inclinar);
      card.addEventListener('mouseleave', enderezar);
      this.limpiezas.push(() => {
        card.removeEventListener('mousemove', inclinar);
        card.removeEventListener('mouseleave', enderezar);
      });
    });

    // 3. Progreso del timeline + parallax del hero, atados al scroll (un solo listener)
    const pasos = document.querySelector<HTMLElement>('.steps.timeline');
    const relleno = document.querySelector<HTMLElement>('.timeline-fill');
    const hero = document.querySelector<HTMLElement>('.hero-brand');
    const heroContenido = document.querySelector<HTMLElement>('.hero-brand .hero-copy');

    let turnoPedido = false;
    const alDesplazar = () => {
      if (turnoPedido) return;
      turnoPedido = true;

      requestAnimationFrame(() => {
        turnoPedido = false;
        const altoVentana = window.innerHeight;

        if (pasos && relleno) {
          const rect = pasos.getBoundingClientRect();
          const progreso = Math.min(1, Math.max(0, (altoVentana * 0.75 - rect.top) / rect.height));
          relleno.style.setProperty('--p', progreso.toFixed(3));
        }

        if (hero && heroContenido) {
          const desplazamiento = Math.min(window.scrollY, hero.offsetHeight);
          heroContenido.style.transform = `translateY(${desplazamiento * 0.22}px)`;
          heroContenido.style.opacity = `${1 - desplazamiento / (hero.offsetHeight * 0.95)}`;
        }
      });
    };

    window.addEventListener('scroll', alDesplazar, { passive: true });
    alDesplazar();
    this.limpiezas.push(() => window.removeEventListener('scroll', alDesplazar));
  }

  goRegister(): void { 
    this.router.navigate(['/registro']); 
  }

  goCursos(): void { 
    this.router.navigate(['/cursos']); 
  }

  scrollToHowItWorks(event: Event): void {
    event.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}