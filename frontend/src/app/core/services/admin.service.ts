import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CursoApi,
  EstadoCurso,
  RespuestaApi,
  ResumenRoles,
  RolUsuario,
  UsuarioApi
} from '../../models/admin.models';

export interface CrearCursoDto {
  titulo: string;
  descripcion: string;
  categoria: string;
  mentor?: string;
  precio?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiBase = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  listarUsuarios(filtros?: { rol?: string; busqueda?: string; limite?: number }): Observable<{
    usuarios: UsuarioApi[]; total: number; pagina: number; limite: number;
  }> {
    let params = new HttpParams();
    if (filtros?.rol) params = params.set('rol', filtros.rol);
    if (filtros?.busqueda) params = params.set('busqueda', filtros.busqueda);
    params = params.set('limite', String(filtros?.limite ?? 200));

    return this.http
      .get<RespuestaApi<{ usuarios: UsuarioApi[]; total: number; pagina: number; limite: number }>>(
        `${this.apiBase}/usuarios`, { params }
      )
      .pipe(map(res => res.data));
  }

  resumenRoles(): Observable<ResumenRoles> {
    return this.http
      .get<RespuestaApi<{ resumen: ResumenRoles }>>(`${this.apiBase}/usuarios/resumen`)
      .pipe(map(res => res.data.resumen));
  }

  cambiarRol(id: string, rol: RolUsuario): Observable<UsuarioApi> {
    return this.http
      .patch<RespuestaApi<{ usuario: UsuarioApi }>>(`${this.apiBase}/usuarios/${id}/rol`, { rol })
      .pipe(map(res => res.data.usuario));
  }

  cambiarEstado(id: string, activo: boolean): Observable<UsuarioApi> {
    return this.http
      .patch<RespuestaApi<{ usuario: UsuarioApi }>>(`${this.apiBase}/usuarios/${id}/estado`, { activo })
      .pipe(map(res => res.data.usuario));
  }

  crearUsuario(dto: { nombre: string; email: string; contrasena: string; rol: RolUsuario }): Observable<UsuarioApi> {
    return this.http
      .post<RespuestaApi<{ usuario: UsuarioApi }>>(`${this.apiBase}/usuarios`, dto)
      .pipe(map(res => res.data.usuario));
  }

  listarTodosCursos(): Observable<CursoApi[]> {
    return this.http
      .get<RespuestaApi<{ cursos: CursoApi[] }>>(`${this.apiBase}/cursos/admin/todos`)
      .pipe(map(res => res.data.cursos));
  }

  crearCurso(dto: CrearCursoDto): Observable<CursoApi> {
    return this.http
      .post<RespuestaApi<{ curso: CursoApi }>>(`${this.apiBase}/cursos`, dto)
      .pipe(map(res => res.data.curso));
  }

  cambiarEstadoCurso(id: string, estado: EstadoCurso): Observable<CursoApi> {
    return this.http
      .patch<RespuestaApi<{ curso: CursoApi }>>(`${this.apiBase}/cursos/${id}/estado`, { estado })
      .pipe(map(res => res.data.curso));
  }

  eliminarCurso(id: string): Observable<void> {
    return this.http
      .delete<RespuestaApi<null>>(`${this.apiBase}/cursos/${id}`)
      .pipe(map(() => undefined));
  }
}
