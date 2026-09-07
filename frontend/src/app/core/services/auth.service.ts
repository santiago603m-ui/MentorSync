import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioLoginReq, UsuarioRegistroReq, AuthRespuesta } from "/Users/PC_06/Desktop/MentorSync/frontend/src/app/models/auth.model";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/api/auth'; // Url del Backend

  constructor(private http: HttpClient) {}

  login(credenciales: UsuarioLoginReq): Observable<AuthRespuesta> {
    return this.http.post<AuthRespuesta>(`${this.apiUrl}/inicio-sesion`, credenciales);
  }

  register(datos: UsuarioRegistroReq): Observable<AuthRespuesta> {
    return this.http.post<AuthRespuesta>(`${this.apiUrl}/registro`, datos);
  }
}