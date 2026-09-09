import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { UsuarioLoginReq, UsuarioRegistroReq, AuthRespuesta } from '../../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:4000/api/auth';

  private loggedInSubject: BehaviorSubject<boolean>;
  isLoggedIn$;

  private userRoleSubject: BehaviorSubject<string | null>;
  userRole$;

  constructor(private http: HttpClient) {
    // 👇 Inicializa los subjects en el constructor
    this.loggedInSubject = new BehaviorSubject<boolean>(!!this.getToken());
    this.isLoggedIn$ = this.loggedInSubject.asObservable();

    this.userRoleSubject = new BehaviorSubject<string | null>(this.getRol());
    this.userRole$ = this.userRoleSubject.asObservable();
  }

  login(credenciales: UsuarioLoginReq): Observable<AuthRespuesta> {
    return this.http.post<AuthRespuesta>(`${this.apiUrl}/inicio-sesion`, credenciales);
  }

  register(datos: UsuarioRegistroReq): Observable<AuthRespuesta> {
    return this.http.post<AuthRespuesta>(`${this.apiUrl}/registro`, datos);
  }

  guardarSesion(respuesta: AuthRespuesta) {
    localStorage.setItem('token', respuesta.data.token);
    localStorage.setItem('rol', respuesta.data.usuario.rol || '');
    localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));

    this.loggedInSubject.next(true);
    this.userRoleSubject.next(respuesta.data.usuario.rol || '');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  isLoggedIn(): boolean {
    return !!this.getToken(); // 👈 Método público para verificar sesión
  }

  private normalizar(valor?: string | null): string {
    return (valor || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  rolCoincide(rolesPermitidos: string[]): boolean {
    const actual = this.normalizar(this.getRol());
    return rolesPermitidos.some(r => this.normalizar(r) === actual);
  }

  getUsuario(): { id: string; nombre: string; email: string; rol?: string } | null {
    const raw = localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario');
    this.loggedInSubject.next(false);
    this.userRoleSubject.next(null);
  }

  rutaSegunRol(rol?: string | null): string {
    const r = this.normalizar(rol);
    if (r === 'aprendiz') return '/aprendiz';
    if (r === 'mentor') return '/mentor';
    if (r === 'administrador' || r === 'admin') return '/admin';
    return '/';
  }
}
