import { Component, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { CursoService } from "../../core/services/curso.service";
import { Curso } from '../../models/curso.model';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { PagoService } from '../../core/services/pago.service';

@Component({
  selector: 'app-cursos-page',
  standalone: true,
  templateUrl: './cursos-page.component.html',
  styleUrls: ['./cursos-page.component.css'],
  imports: [CommonModule, FormsModule, CurrencyPipe]
})
export class CursosPageComponent implements OnInit, AfterViewInit {
  searchTerm = '';
  selectedOrder = 'priceAsc';
  selectedCourse: Curso | null = null;
  cursos: Curso[] = [];
  displayedCourses: Curso[] = [];
  cargando = true;
  procesandoPago = false;

  // 👇 aquí inyectamos ChangeDetectorRef
  constructor(
    private router: Router,
    private cursoService: CursoService,
    private authService: AuthService,
    private pagoService: PagoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cursoService.obtenerCursos().subscribe({
      next: (cursos: Curso[]) => {
        console.log('Cursos recibidos en Angular:', cursos);
        this.cursos = cursos;
        this.recomputeCourses(); // 👈 llena displayedCourses
        this.cargando = false;
        this.cdr.detectChanges(); // 👈 fuerza actualización de la vista
      },
      error: (err) => {
        console.error('Error al cargar cursos desde MongoDB:', err);
        this.cursos = [];
        this.recomputeCourses();
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  inscribirse() {
    const curso = this.selectedCourse;
    if (!curso?._id) return;

    if (
      curso.precio > 0 &&
      this.authService.isLoggedIn() &&
      this.authService.rolCoincide(['Aprendiz'])
    ) {
      if (this.procesandoPago) return;
      this.procesandoPago = true;
      this.pagoService.crearCheckout(curso._id).subscribe({
        next: ({ data }) => {
          const destino = data.modoSimulacion ? data.simuladorUrl : data.redirectUrl;
          if (destino) {
            this.pagoService.abrirCheckout(destino);
          } else {
            this.procesandoPago = false;
          }
        },
        error: (error: unknown) => {
          this.procesandoPago = false;
          const apiError = error as {
            error?: { message?: string; error?: { message?: string } };
          };
          alert(apiError.error?.error?.message || apiError.error?.message || 'No se pudo iniciar el pago.');
        },
      });
      return;
    }

    this.selectedCourse = null;
    this.router.navigate(['/login']);
  }

  private get reducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngAfterViewInit() {}

  onFiltersChanged() {
    this.recomputeCourses();
    requestAnimationFrame(() => this.animateGrid());
  }

  private recomputeCourses() {
    const termino = this.searchTerm.trim().toLowerCase();
    let result = this.cursos.filter(curso => {
      const tituloCurso = (curso.titulo || '').toLowerCase();
      return termino === '' || tituloCurso.includes(termino);
    });

    switch (this.selectedOrder) {
      case 'priceAsc': result = result.sort((a, b) => a.precio - b.precio); break;
      case 'priceDesc': result = result.sort((a, b) => b.precio - a.precio); break;
    }

    this.displayedCourses = result;
    console.log('Cursos a mostrar:', this.displayedCourses); // 👈 confirma
  }

  filteredCourses() {
    return this.displayedCourses;
  }

  trackById(index: number, curso: Curso): string {
    return curso._id?.toString() ?? index.toString();
  }

  private animateGrid() {
    const cards = document.querySelectorAll('.minimal-card');
    if (!cards.length) return;
    if (this.reducedMotion) {
      gsap.set(cards, { opacity: 1, y: 0 });
      return;
    }
    gsap.killTweensOf(cards);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.06, ease: 'back.out(1.5)' }
    );
  }

  selectCourse(curso: Curso) {
    this.selectedCourse = curso;
    requestAnimationFrame(() => {
      if (this.reducedMotion) return;
      gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power1.out' });
      gsap.fromTo(
        '.modal-card',
        { opacity: 0, y: 40, scale: 0.85 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    });
  }

  closeModal() {
    if (!this.selectedCourse) return;
    if (this.reducedMotion) {
      this.selectedCourse = null;
      return;
    }
    const card = document.querySelector('.modal-card');
    const backdrop = document.querySelector('.modal-backdrop');
    if (!card || !backdrop) {
      this.selectedCourse = null;
      return;
    }
    gsap.to(card, { opacity: 0, y: 20, scale: 0.85, duration: 0.15, ease: 'power2.in' });
    gsap.to(backdrop, {
      opacity: 0,
      duration: 0.15,
      onComplete: () => {
        this.selectedCourse = null;
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}