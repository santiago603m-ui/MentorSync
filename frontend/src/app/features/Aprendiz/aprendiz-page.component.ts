import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterPipe } from '../../shared/pipes/filter.pipe';
import { CursoService } from '../../core/services/curso.service';
import { Curso } from '../../models/curso.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-aprendiz-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  templateUrl: './aprendiz-page.component.html',
  styleUrls: ['./aprendiz-page.component.css']
})
export class AprendizPageComponent implements OnInit {
  activeModule: 'dashboard' | 'cursos' = 'dashboard'; // 👈 solo dashboard y cursos
  searchCurso = '';
  cursos: Curso[] = [];

  constructor(
    private cursoService: CursoService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarCursos();
  }

  private cargarCursos() {
    this.cursoService.obtenerCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        console.log('Cursos cargados:', this.cursos);
      },
      error: (err) => console.error('Error cargando cursos:', err)
    });
  }

  inscribir(cursoId: string) {
    if (!this.authService.isLoggedIn()) {
      // 👇 Si no está logueado, redirige al login
      this.router.navigate(['/login']);
      return;
    }

    // 👇 Si está logueado y en Aprendiz, registra en la BD
    this.cursoService.inscribir(cursoId).subscribe({
      next: (res) => {
        console.log('Inscripción guardada:', res);
        alert('Inscrito exitosamente en el curso');
        window.location.reload(); // 👈 recarga la página automáticamente
      },
      error: (err) => {
        console.error('Error al inscribirse:', err);
        alert('No se pudo inscribir, intenta de nuevo.');
      }
    });
  }

  cancelarInscripcion(cursoId: string, inscritoId: string) {
    this.cursoService.cancelarInscripcion(cursoId, inscritoId).subscribe({
      next: (res: { data: { curso: Curso } }) => {
        console.log('Inscripción cancelada:', res);
        alert('Inscripción cancelada correctamente');
        window.location.reload(); // 👈 recarga la página automáticamente
      },
      error: (err: any) => {
        console.error('Error al cancelar inscripción:', err);
        alert('No se pudo cancelar la inscripción, intenta de nuevo.');
      }
    });
  }



  // 👇 Función correcta para trackBy
  trackById(index: number, curso: Curso): string {
    return curso._id ?? index.toString();
  }
}
