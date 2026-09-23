import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators'; // 👈 añadimos tap
import { Curso } from '../../models/curso.model'; // 👈 Modelo alineado al backend

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private apiUrl = 'http://localhost:4000/api/cursos';
  private cursosSubject = new BehaviorSubject<Curso[]>([]);
  cursos$: Observable<Curso[]> = this.cursosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCursos(): Curso[] {
    return this.cursosSubject.getValue();
  }

  agregarCurso(nuevoCurso: Curso) {
    const actuales = this.getCursos();
    this.cursosSubject.next([...actuales, nuevoCurso]);
  }

  // 🔹 Optimizado: actualiza el BehaviorSubject apenas llegan los datos
  obtenerCursos(): Observable<Curso[]> {
    return this.http
      .get<{ data: { cursos: Curso[] } }>(this.apiUrl, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      })
      .pipe(
        map(response => response.data.cursos),
        tap(cursos => this.cursosSubject.next(cursos)) // 👈 actualiza rápido
      );
  }

  obtenerMisCursos(): Observable<Curso[]> {
    return this.http
      .get<{ data: { cursos: Curso[] } }>(`${this.apiUrl}/mis-cursos`)
      .pipe(map(r => r.data.cursos));
  }

  crearCurso(dto: { titulo: string; descripcion: string; categoria: string; precio?: number }): Observable<Curso> {
    return this.http
      .post<{ success: boolean; data: { curso: Curso } }>(this.apiUrl, dto)
      .pipe(map(r => r.data.curso));
  }

  actualizarCurso(id: string, cambios: Partial<Curso>): Observable<Curso> {
    return this.http
      .patch<{ success: boolean; data: { curso: Curso } }>(`${this.apiUrl}/${id}`, cambios)
      .pipe(map(r => r.data.curso));
  }

  cambiarEstadoCurso(id: string, estado: string): Observable<Curso> {
    return this.http
      .patch<{ success: boolean; data: { curso: Curso } }>(`${this.apiUrl}/${id}/estado`, { estado })
      .pipe(map(r => r.data.curso));
  }

  eliminarCurso(id: string): Observable<void> {
    return this.http.delete<{ success: boolean; data: null }>(`${this.apiUrl}/${id}`).pipe(map(() => undefined));
  }

  subirDocumento(cursoId: string, archivo: File): Observable<{ documento: any; vistaPrevia: any }> {
    const fd = new FormData();
    fd.append('archivo', archivo);
    return this.http
      .post<{ success: boolean; data: { documento: any; vistaPrevia: any } }>(`${this.apiUrl}/${cursoId}/documentos`, fd)
      .pipe(map(r => r.data));
  }

  listarDocumentos(cursoId: string): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: { documentos: any[] } }>(`${this.apiUrl}/${cursoId}/documentos`)
      .pipe(map(r => r.data.documentos));
  }

  obtenerCursoPorId(id: string): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl}/${id}`);
  }

  generarEstructuraCurso(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/generar-estructura`, {});
  }

  // 🔹 Método para inscribir al aprendiz en un curso
  inscribir(cursoId: string): Observable<{ data: { curso: Curso } }> {
    return this.http.post<{ data: { curso: Curso } }>(`${this.apiUrl}/${cursoId}/inscribir`, {});
  }

  // 🔹 Método para cancelar inscripción de un aprendiz en un curso
  cancelarInscripcion(cursoId: string, inscritoId: string): Observable<{ data: { curso: Curso } }> {
    return this.http.delete<{ data: { curso: Curso } }>(`${this.apiUrl}/${cursoId}/inscritos/${inscritoId}`);
  }
}
