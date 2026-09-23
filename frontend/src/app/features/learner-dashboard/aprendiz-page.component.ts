import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterPipe } from '../../shared/pipes/filter.pipe';
import { CursoService } from '../../core/services/curso.service';
import { Curso } from '../../models/curso.model';
import { AuthService } from '../../core/services/auth.service';
import { VantaBackgroundComponent } from '../../shared/components/vanta-background/vanta-background.component';
import { NavbarComponent } from '../../layouts/navbar/navbar.component';
import { PagoService } from '../../core/services/pago.service';
import { LiveSessionService } from '../../core/services/live-session.service';

@Component({
  selector: 'app-aprendiz-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe, VantaBackgroundComponent, NavbarComponent],
  templateUrl: './aprendiz-page.component.html',
  styleUrls: ['./aprendiz-page.component.css']
})
export class AprendizPageComponent implements OnInit {
  activeModule: 'dashboard' | 'cursos' = 'dashboard'; // 👈 solo dashboard y cursos
  searchCurso = '';
  cursos: Curso[] = [];
  codigoSesion = '';

  constructor(
    private cursoService: CursoService,
    private authService: AuthService,
    private router: Router,
    private pagoService: PagoService,
  private liveSessionService: LiveSessionService
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

    //Si el curso tiene precio, redirige a la pasarela de pago
    const curso = this.cursos.find(c => c._id === cursoId);
    if (curso && curso.precio > 0) {
      this.pagoService.crearCheckout(cursoId).subscribe({
        next: (res) => { window.location.href = res.data.checkoutUrl; },
        error: (err) => alert(err?.error?.error?.message ?? 'No se pudo iniciar el pago, intenta de nuevo.')
      });
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



  unirseSesionVivo(): void {
    const id = this.liveSessionService.extraerId(this.codigoSesion);
    if (!id) {
      alert('Código o link inválido. Pega el ID de 24 caracteres o el link completo.');
      return;
    }
    this.router.navigate(['/sesion', id]);
  }

  // 👇 Función correcta para trackBy
  trackById(index: number, curso: Curso): string {
    return curso._id ?? index.toString();
  }
}
