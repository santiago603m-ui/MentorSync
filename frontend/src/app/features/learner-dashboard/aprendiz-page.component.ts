import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterPipe } from '../../shared/pipes/filter.pipe';
import { CursoService } from '../../core/services/curso.service';
import { Curso } from '../../models/curso.model';
import { AuthService } from '../../core/services/auth.service';
import { LiveSessionService } from '../../core/services/live-session.service';

@Component({
  selector: 'app-aprendiz-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  templateUrl: './aprendiz-page.component.html',
  styleUrls: ['./aprendiz-page.component.css']
})
export class AprendizPageComponent implements OnInit {
  activeModule: 'dashboard' | 'cursos' = 'dashboard';
  searchCurso = '';
  cursos: Curso[] = [];
  codigoSesion = '';
  cargando = true;
  usuario: { id?: string; _id?: string; nombre?: string; email?: string; rol?: string } | null = null;

  constructor(
    private cursoService: CursoService,
    private authService: AuthService,
    private router: Router,
    private liveSessionService: LiveSessionService
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.cargarCursos();
  }

  private cargarCursos() {
    this.cargando = true;
    this.cursoService.obtenerCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos:', err);
        this.cargando = false;
      }
    });
  }

  /** Cursos en los que el usuario logueado está inscrito */
  get misCursosInscritos(): Curso[] {
    return this.cursos.filter((c) => this.estaInscrito(c));
  }

  /** Comprueba si el usuario logueado está inscrito en el curso */
  estaInscrito(curso: any): boolean {
    if (!curso?.inscritos || !Array.isArray(curso.inscritos)) return false;
    const uId = this.usuario?.id || (this.usuario as any)?._id;
    const uEmail = this.usuario?.email;
    return curso.inscritos.some((ins: any) => {
      const insId = typeof ins.id === 'object' ? ins.id?._id || ins.id?.id : ins.id;
      return (uId && (insId === uId || ins._id === uId)) || (uEmail && ins.correo === uEmail);
    });
  }

  /** Obtiene el _id de la inscripción para poder cancelarla */
  obtenerInscripcionId(curso: any): string {
    if (!curso?.inscritos || !Array.isArray(curso.inscritos)) return '';
    const uId = this.usuario?.id || (this.usuario as any)?._id;
    const uEmail = this.usuario?.email;
    const ins = curso.inscritos.find((i: any) => {
      const insId = typeof i.id === 'object' ? i.id?._id || i.id?.id : i.id;
      return (uId && (insId === uId || i._id === uId)) || (uEmail && i.correo === uEmail);
    });
    return ins?._id || ins?.id || '';
  }

  inscribir(cursoId?: string) {
    if (!cursoId) return;
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cursoService.inscribir(cursoId).subscribe({
      next: () => {
        alert('Inscrito exitosamente en el curso');
        this.cargarCursos();
      },
      error: (err) => {
        console.error('Error al inscribirse:', err);
        alert(err.error?.message || 'No se pudo inscribir, intenta de nuevo.');
      }
    });
  }

  cancelarInscripcion(cursoId?: string, inscritoId?: string) {
    if (!cursoId) return;
    const idAEnviar = inscritoId || this.obtenerInscripcionId(this.cursos.find(c => c._id === cursoId));
    if (!idAEnviar) {
      alert('No se encontró el registro de inscripción.');
      return;
    }

    this.cursoService.cancelarInscripcion(cursoId, idAEnviar).subscribe({
      next: () => {
        alert('Inscripción cancelada correctamente');
        this.cargarCursos();
      },
      error: (err: any) => {
        console.error('Error al cancelar inscripción:', err);
        alert('No se pudo cancelar la inscripción, intenta de nuevo.');
      }
    });
  }

  unirseSesionVivo(): void {
    const id = this.liveSessionService.extraerId(this.codigoSesion);
    if (!id) {
      alert('Código o link inválido. Pega el ID de 24 caracteres o el link completo.');
      return;
    }
    this.router.navigate(['/sesion', id]);
  }

  trackById(index: number, curso: Curso): string {
    return curso._id ?? index.toString();
  }
}

