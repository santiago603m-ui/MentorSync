import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';

import { NavbarComponent } from '../../../../layouts/navbar/navbar.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePage implements AfterViewInit {
  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      gsap.set('.chat-bubble', { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-title', { opacity: 0, y: 45, duration: 0.4 })
      .from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.35 }, '-=0.2')
      .from('.hero-actions > *', { opacity: 0, y: 30, scale: 0.85, stagger: 0.08, duration: 0.35, ease: 'back.out(1.7)' }, '-=0.15')
      .from('.mentor-strip', { opacity: 0, y: 20, duration: 0.3 }, '-=0.1')
      .from('.session-window', { opacity: 0, x: 60, scale: 0.92, duration: 0.45, ease: 'power3.out' }, '-=0.35')
      .from('.code-line', {
        clipPath: 'inset(0 100% 0 0)',
        stagger: 0.1,
        duration: 0.25,
        ease: 'steps(14)'
      }, '-=0.1')
      .fromTo('.chat-bubble',
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.7)' },
        '+=0.05');
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