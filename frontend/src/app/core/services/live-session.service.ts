import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface LiveSession {
  _id: string;
  courseId: string | { _id: string; titulo: string; mentor: string };
  mentorId: string | { _id: string; nombre: string; email: string };
  titulo: string;
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  fechaInicioProgramada: string;
  fechaInicioReal?: string;
  fechaFin?: string;
  urlReunion?: string;
  asistentes: string[];
  createdAt: string;
}

export interface ChatSesionMensaje {
  _id: string;
  liveSessionId: string;
  courseId: string;
  remitenteId: string | null;
  rolRemitente: string;
  contenido: string;
  createdAt: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class LiveSessionService {
  private apiBase = 'http://localhost:4000/api/sesiones';

  constructor(private http: HttpClient) {}

  crear(dto: { courseId: string; titulo: string; fechaInicioProgramada: string; urlReunion?: string }): Observable<LiveSession> {
    return this.http
      .post<{ success: boolean; data: { sesion: LiveSession } }>(this.apiBase, dto)
      .pipe(map((r) => r.data.sesion));
  }

  listarPorCurso(courseId: string): Observable<LiveSession[]> {
    return this.http
      .get<{ success: boolean; data: { sesiones: LiveSession[] } }>(`${this.apiBase}/curso/${courseId}`)
      .pipe(map((r) => r.data.sesiones));
  }

  obtener(id: string): Observable<LiveSession> {
    return this.http
      .get<{ success: boolean; data: { sesion: LiveSession } }>(`${this.apiBase}/${id}`)
      .pipe(map((r) => r.data.sesion));
  }

  cambiarEstado(id: string, estado: LiveSession['estado']): Observable<LiveSession> {
    return this.http
      .patch<{ success: boolean; data: { sesion: LiveSession } }>(`${this.apiBase}/${id}/estado`, { estado })
      .pipe(map((r) => r.data.sesion));
  }

  listarMensajes(id: string): Observable<ChatSesionMensaje[]> {
    return this.http
      .get<{ success: boolean; data: { mensajes: ChatSesionMensaje[] } }>(`${this.apiBase}/${id}/mensajes`)
      .pipe(map((r) => r.data.mensajes));
  }

  /** Link para compartir: /sesion/:id */
  generarLink(id: string): string {
    return `${window.location.origin}/sesion/${id}`;
  }

  /** Extrae el ID desde un link o código pegado */
  extraerId(input: string): string | null {
    const trimmed = input.trim();
    // Si es URL, extrae el último segmento
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (/^[0-9a-fA-F]{24}$/.test(last)) return last;
    } catch {
      // No es URL, sigue
    }
    if (/^[0-9a-fA-F]{24}$/.test(trimmed)) return trimmed;
    return null;
  }
}
