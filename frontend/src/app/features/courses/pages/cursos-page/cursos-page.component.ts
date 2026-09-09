import { Component, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';

@Component({
  selector: 'app-cursos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cursos-page">
      <div class="page-heading">
        <h2>Cursos disponibles</h2>
        <p>Elige un curso y aprende directamente con el mentor y su asistente de IA.</p>
      </div>

      <div class="toolbar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (ngModelChange)="onFiltersChanged()"
          placeholder="Buscar curso por nombre..."
          class="input"
        />
        <select [(ngModel)]="selectedOrder" (ngModelChange)="onFiltersChanged()" class="select">
          <option value="priceAsc">Precio: menor a mayor</option>
          <option value="priceDesc">Precio: mayor a menor</option>
        </select>
      </div>

      <div class="courses-grid" *ngIf="displayedCourses.length; else emptyState">
        <button
          *ngFor="let curso of displayedCourses"
          class="course-card"
          (click)="selectCourse(curso)"
          type="button"
        >
          <div class="card-header">
            <span class="dot dot-a"></span>
            <span class="dot dot-b"></span>
            <span class="dot dot-c"></span>
            <span class="card-header-label">{{ curso.duracion }}</span>
          </div>
          <div class="image-wrap">
            <img [src]="curso.imagen" alt="{{ curso.nombre }}" class="card-image" />
          </div>
          <div class="card-info">
            <h3>{{ curso.nombre }}</h3>
            <span class="price-tag">{{ curso.precio | currency:'USD' }}</span>
          </div>
        </button>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <span class="dot dot-a"></span>
          <span class="dot dot-b"></span>
          <span class="dot dot-c"></span>
          <p>No encontramos cursos que coincidan con "{{ searchTerm }}".</p>
        </div>
      </ng-template>

      <div class="modal" *ngIf="selectedCourse" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="card-header">
            <span class="dot dot-a"></span>
            <span class="dot dot-b"></span>
            <span class="dot dot-c"></span>
            <span class="card-header-label">{{ selectedCourse.duracion }}</span>
            <button class="close-btn" (click)="closeModal()" aria-label="Cerrar">&times;</button>
          </div>
          <div class="image-wrap modal-image-wrap">
            <img [src]="selectedCourse.imagen" alt="{{ selectedCourse.nombre }}" class="modal-image" />
          </div>
          <div class="modal-body">
            <h2>{{ selectedCourse.nombre }}</h2>
            <p class="price">{{ selectedCourse.precio | currency:'USD' }}</p>
            <p><strong>Duración:</strong> {{ selectedCourse.duracion }}</p>
            <p class="desc">{{ selectedCourse.descripcion }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursos-page { padding: 3rem 0 4rem; width: 100%; }

    .page-heading { margin-bottom: 2rem; }
    .page-heading h2 { font-size: 1.7rem; margin-bottom: 0.4rem; }
    .page-heading p { color: var(--text-secondary); font-size: 0.95rem; }

    .toolbar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .input, .select {
      padding: 0.7rem 1rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--surface-1);
      color: var(--text-primary);
      outline: none;
      font-size: 0.92rem;
      transition: border-color 0.2s ease;
    }
    .input { flex: 1; min-width: 220px; }
    .input::placeholder { color: var(--text-muted); }
    .input:focus, .select:focus { border-color: var(--accent-cyan); }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    @media (max-width: 1000px) { .courses-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .courses-grid { grid-template-columns: 1fr; } }

    .course-card {
      background: var(--surface-2);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      text-align: left;
      padding: 0;
      font-family: inherit;
      transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
      will-change: transform;
    }
    .course-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-strong);
      box-shadow: var(--shadow-card);
    }
    .course-card:focus-visible {
      border-color: var(--accent-cyan);
      box-shadow: var(--shadow-card);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.6rem 0.8rem;
      background: var(--surface-1);
      border-bottom: 1px solid var(--border-subtle);
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot-a { background: var(--accent-violet); }
    .dot-b { background: var(--accent-cyan); }
    .dot-c { background: var(--text-muted); }
    .card-header-label {
      margin-left: 0.3rem;
      font-size: 0.72rem;
      color: var(--text-muted);
      font-family: 'SFMono-Regular', Consolas, monospace;
    }

    .image-wrap { position: relative; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: saturate(0.85) contrast(1.05);
      transition: transform 0.4s ease;
    }
    .course-card:hover .card-image { transform: scale(1.05); }

    .card-info {
      padding: 1rem 1.1rem 1.2rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .card-info h3 { font-size: 1rem; font-weight: 600; }
    .price-tag { font-size: 0.88rem; font-weight: 700; color: var(--accent-cyan); }

    /* Estado vacío */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 3.5rem 1rem;
      background: var(--surface-2);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-align: center;
    }
    .empty-state .dot { display: none; }

    /* Modal */
    .modal {
      position: fixed;
      inset: 0;
      background: rgba(4, 6, 12, 0.72);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 1.5rem;
    }
    .modal-content {
      background: var(--surface-2);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-pop);
      border-radius: var(--radius-md);
      max-width: 420px;
      width: 100%;
      overflow: hidden;
    }
    .modal-content .card-header { position: relative; }
    .close-btn {
      margin-left: auto;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      line-height: 1;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      transition: color 0.15s ease;
    }
    .close-btn:hover { color: var(--text-primary); }
    .modal-body { padding: 1.4rem 1.5rem 1.6rem; text-align: center; }
    .modal-body h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .price { color: var(--accent-cyan); font-weight: 700; margin-bottom: 0.75rem; }
    .desc { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.55; }
  `]
})
export class CursosPageComponent implements AfterViewInit {
  searchTerm = '';
  selectedOrder = 'priceAsc';
  selectedCourse: any = null;

  cursos = [
    { nombre: 'Angular Básico', precio: 50, duracion: '10 horas', descripcion: 'Curso introductorio de Angular para principiantes.', imagen: 'https://picsum.photos/400/400?random=1' },
    { nombre: 'Node.js Avanzado', precio: 120, duracion: '20 horas', descripcion: 'Curso avanzado de Node.js para backend.', imagen: 'https://picsum.photos/400/400?random=2' },
    { nombre: 'Machine Learning Intro', precio: 80, duracion: '15 horas', descripcion: 'Introducción a Machine Learning con ejemplos prácticos.', imagen: 'https://picsum.photos/400/400?random=3' },
    { nombre: 'Laravel Intermedio', precio: 90, duracion: '12 horas', descripcion: 'Curso intermedio de Laravel para desarrollo web.', imagen: 'https://picsum.photos/400/400?random=4' }
  ];

  displayedCourses: any[] = [];

  private get reducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngAfterViewInit() {
    this.recomputeCourses();
    this.animateGrid();
  }

  onFiltersChanged() {
    this.recomputeCourses();
    // Espera a que Angular pinte el nuevo *ngFor antes de animar.
    requestAnimationFrame(() => this.animateGrid());
  }

  private recomputeCourses() {
    let result = this.cursos.filter(curso =>
      curso.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    switch (this.selectedOrder) {
      case 'priceAsc': result = result.sort((a, b) => a.precio - b.precio); break;
      case 'priceDesc': result = result.sort((a, b) => b.precio - a.precio); break;
    }
    this.displayedCourses = result;
  }

  // Se mantiene por compatibilidad si algo más del template la invoca.
  filteredCourses() {
    return this.displayedCourses;
  }

  private animateGrid() {
    const cards = document.querySelectorAll('.course-card');
    if (!cards.length) return;
    if (this.reducedMotion) {
      gsap.set(cards, { opacity: 1, y: 0 });
      return;
    }
    gsap.killTweensOf(cards);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 40, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.05, ease: 'back.out(1.7)' }
    );
  }

  selectCourse(curso: any) {
    this.selectedCourse = curso;
    requestAnimationFrame(() => {
      if (this.reducedMotion) return;
      gsap.fromTo('.modal', { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power1.out' });
      gsap.fromTo(
        '.modal-content',
        { opacity: 0, y: 40, scale: 0.85 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'back.out(1.8)' }
      );
    });
  }

  closeModal() {
    if (!this.selectedCourse) return;
    if (this.reducedMotion) {
      this.selectedCourse = null;
      return;
    }
    const content = document.querySelector('.modal-content');
    const overlay = document.querySelector('.modal');
    if (!content || !overlay) {
      this.selectedCourse = null;
      return;
    }
    gsap.to(content, { opacity: 0, y: 24, scale: 0.85, duration: 0.15, ease: 'power2.in' });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.15,
      onComplete: () => { this.selectedCourse = null; }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}
