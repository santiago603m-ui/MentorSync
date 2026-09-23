import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LiveSessionService, LiveSession } from '../../core/services/live-session.service';
import { CursoService } from '../../core/services/curso.service';

// ==========================================
// INTERFACES
// ==========================================
export interface Aprendiz {
  id: number;
  nombre: string;
  curso: string;
  novedad: string;
  estado: 'Pendiente' | 'Aprobado' | 'No Aprobado';
}

export interface Curso {
  id: number;
  _id?: string;
  nombre: string;
  categoria: string;
  estado: 'Activo' | 'Inactivo';
  alumnos: number;
  descripcion?: string;
  bot?: { entrenado?: boolean; fechaEntrenamiento?: Date; documentoOrigenNombre?: string; totalChunks?: number };
}

export interface DiaSemana {
  dia: string;
  entregas: number;
  porcentaje: number;
}

export interface Entrega {
  id: number;
  aprendiz: string;
  actividad: string;
  fecha: string;
  estado: 'Pendiente' | 'Calificado';
  nota?: number;
}

// ==========================================
// COMPONENTE HIJO (DASHBOARD QUICK)
// ==========================================
@Component({
  selector: 'app-mentor-dashboard-quick',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-inner-container">
      <!-- Métricas Rápidas -->
      <div class="quick-stats-grid">
        <div class="stat-card">
          <div class="stat-icon bg-cyan">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ totalCursos }}</span>
            <span class="stat-label">Cursos Asignados</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-purple">
            <i class="fas fa-user-graduate"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ totalAprendices }}</span>
            <span class="stat-label">Aprendices</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-pink">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ tasaAprobacion }}%</span>
            <span class="stat-label">Tasa de Aprobación</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-amber">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ pendientes }}</span>
            <span class="stat-label">Revisiones Pendientes</span>
          </div>
        </div>
      </div>

      <!-- Actividad Semanal -->
      <div class="activity-section">
        <div class="activity-header">
          <div>
            <h3 class="activity-title">
              <i class="fas fa-chart-line"></i> Entregas de la Semana
            </h3>
            <p class="activity-subtitle">
              Total de actividades recibidas: <strong>{{ totalEntregasSemana }}</strong>
            </p>
          </div>
        </div>

        <div class="days-grid">
          @for (d of diasSemana; track d.dia) {
            <div class="day-card">
              <div class="day-header">
                <span class="day-name">{{ d.dia }}</span>
                <span class="day-count">{{ d.entregas }} entregas</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="d.porcentaje"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      justify-content: center;
    }

    .dashboard-inner-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      justify-content: center;
    }

    .quick-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      background-color: rgba(12, 12, 20, 0.75);
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      transition: all 0.25s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      border-color: rgba(6, 182, 212, 0.35);
      box-shadow: 0 8px 25px rgba(6, 182, 212, 0.1);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .bg-cyan { background: linear-gradient(135deg, #06b6d4, #0284c7); }
    .bg-purple { background: linear-gradient(135deg, #a855f7, #6b21a8); }
    .bg-pink { background: linear-gradient(135deg, #ec4899, #be185d); }
    .bg-amber { background: linear-gradient(135deg, #f59e0b, #b45309); }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.65rem;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .activity-section {
      background-color: rgba(12, 12, 20, 0.75);
      border-radius: 14px;
      padding: 1.5rem 1.75rem;
      border: 1px solid rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
    }

    .activity-header {
      margin-bottom: 1.25rem;
    }

    .activity-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 0;
    }

    .activity-title i {
      color: #06b6d4;
    }

    .activity-subtitle {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-top: 0.35rem;
      margin-bottom: 0;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
    }

    .day-card {
      background-color: rgba(8, 8, 14, 0.6);
      padding: 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .day-name {
      font-weight: 600;
      font-size: 0.85rem;
      color: #e2e8f0;
    }

    .day-count {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background-color: rgba(255, 255, 255, 0.06);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      border-radius: 999px;
      transition: width 0.6s ease;
    }
  `]
})
export class MentorDashboardQuickComponent {
  @Input() totalCursos: number = 0;
  @Input() totalAprendices: number = 0;
  @Input() tasaAprobacion: number = 0;
  @Input() pendientes: number = 0;
  @Input() totalEntregasSemana: number = 0;
  @Input() diasSemana: DiaSemana[] = [];
}

// ==========================================
// COMPONENTE PRINCIPAL (MENTOR PAGE)
// ==========================================
@Component({
  selector: 'app-mentor-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MentorDashboardQuickComponent
  ],
  template: `
    <div class="mentor-layout">
      <!-- Fondo Constelación Estilo MentorSync AI -->
      <div class="constellation-background">
        <div class="constellation-node n1"></div>
        <div class="constellation-node n2"></div>
        <div class="constellation-node n3"></div>
        <div class="constellation-node n4"></div>
        <div class="constellation-node n5"></div>
        <div class="constellation-node n6"></div>
        <div class="constellation-node n7"></div>
        <svg class="constellation-lines" width="100%" height="100%">
          <line x1="15%" y1="20%" x2="45%" y2="60%" stroke="rgba(6, 182, 212, 0.3)" stroke-width="1.5" />
          <line x1="45%" y1="60%" x2="80%" y2="30%" stroke="rgba(6, 182, 212, 0.3)" stroke-width="1.5" />
          <line x1="80%" y1="30%" x2="70%" y2="80%" stroke="rgba(59, 130, 246, 0.25)" stroke-width="1.5" />
          <line x1="25%" y1="75%" x2="45%" y2="60%" stroke="rgba(59, 130, 246, 0.25)" stroke-width="1.5" />
          <line x1="10%" y1="65%" x2="25%" y2="75%" stroke="rgba(139, 92, 246, 0.2)" stroke-width="1.5" />
          <line x1="70%" y1="80%" x2="90%" y2="60%" stroke="rgba(139, 92, 246, 0.2)" stroke-width="1.5" />
        </svg>
      </div>

      <!-- Cuerpo Principal -->
      <div class="panel-body">
        
        <!-- Área de Contenido Principal -->
        <main class="main-content">
          <div class="content-limiter">

            <!-- VISTA 1: DASHBOARD -->
            @if (tabActual === 'dashboard') {
              <section class="section-container">
                <app-mentor-dashboard-quick
                  [totalCursos]="cursos.length"
                  [totalAprendices]="aprendices.length"
                  [tasaAprobacion]="calcularTasaAprobacion()"
                  [pendientes]="contarPendientes()"
                  [totalEntregasSemana]="obtenerTotalEntregasSemana()"
                  [diasSemana]="diasSemana">
                </app-mentor-dashboard-quick>
              </section>
            }

            <!-- VISTA 2: APRENDICES -->
            @if (tabActual === 'aprendices') {
              <section class="card-section">
                <div class="section-header">
                  <h3><i class="fas fa-users"></i> Gestión de Aprendices</h3>
                  <div class="search-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                      type="text" 
                      class="search-input" 
                      placeholder="Buscar por nombre o curso..." 
                      [(ngModel)]="filtroAprendiz" />
                  </div>
                </div>

                <div class="table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Aprendiz</th>
                        <th>Curso</th>
                        <th>Última Novedad</th>
                        <th>Estado</th>
                        <th class="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (a of aprendicesFiltrados; track a.id) {
                        <tr>
                          <td><strong>{{ a.nombre }}</strong></td>
                          <td><span class="text-muted">{{ a.curso }}</span></td>
                          <td>{{ a.novedad }}</td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'badge-warning': a.estado === 'Pendiente',
                              'badge-success': a.estado === 'Aprobado',
                              'badge-danger': a.estado === 'No Aprobado'
                            }">
                              {{ a.estado }}
                            </span>
                          </td>
                          <td class="text-right">
                            <button class="btn-icon btn-approve" (click)="cambiarEstadoAprendiz(a.id, 'Aprobado')" title="Aprobar">
                              <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon btn-reject" (click)="cambiarEstadoAprendiz(a.id, 'No Aprobado')" title="Rechazar">
                              <i class="fas fa-times"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            <!-- VISTA 3: CURSOS -->
            @if (tabActual === 'cursos') {
              <section class="card-section">
                <div class="section-header">
                  <h3><i class="fas fa-graduation-cap"></i> Cursos Asignados</h3>
                  <button class="btn-cyan-glow" (click)="abrirModalCurso()">
                    <i class="fas fa-plus"></i> Nuevo Curso
                  </button>
                </div>

                @if (cargandoCursos) { <p class="text-muted" style="padding:1rem">Cargando tus cursos...</p> }
                @if (errorCursos) { <p style="color:#f87171;padding:1rem">{{ errorCursos }} <button class="btn-cancel" (click)="cargarMisCursos()">Reintentar</button></p> }

                <div class="courses-grid">
                  @for (c of cursos; track c.id) {
                    <div class="course-card">
                      <div class="course-body">
                        <h4>{{ c.nombre }}</h4>
                        <p class="category"><i class="fas fa-tag"></i> {{ c.categoria }} · <span *ngIf="c.bot?.entrenado" class="badge badge-success" style="margin-left:0.4rem">IA entrenada</span><span *ngIf="!c.bot?.entrenado" class="badge badge-warning" style="margin-left:0.4rem">Sin IA</span></p>
                        <p *ngIf="c.descripcion" style="font-size:0.8rem;color:#94a3b8;margin:0.4rem 0 0.8rem;line-height:1.45">{{ c.descripcion }}</p>
                        <div class="course-info">
                          <span><i class="fas fa-user-friends"></i> {{ c.alumnos }} Alumnos</span>
                          <select class="mini-select" style="padding:0.25rem 0.4rem;font-size:0.75rem;background:rgba(8,8,14,0.8);border:1px solid rgba(255,255,255,0.08);color:#cbd5e1;border-radius:6px" [ngModel]="c.estado === 'Activo' ? 'publicado' : 'borrador'" (ngModelChange)="cambiarEstadoCursoReal(c, $event)">
                            <option value="borrador">Borrador</option>
                            <option value="publicado">Publicado</option>
                            <option value="archivado">Archivado</option>
                          </select>
                        </div>
                        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.8rem">
                          <label class="btn-cancel" style="font-size:0.72rem;padding:0.3rem 0.6rem;cursor:pointer">
                            <i class="fas fa-upload"></i> PDF
                            <input type="file" accept=".pdf" style="display:none" (change)="onArchivoSeleccionado($event, c)" />
                          </label>
                          <button class="btn-cancel" style="font-size:0.72rem;padding:0.3rem 0.6rem" (click)="subirPDF(c)" [disabled]="subiendoPDF || !archivoPDF || cursoSeleccionadoId !== (c._id || c.id)">{{ subiendoPDF && cursoSeleccionadoId === (c._id || c.id) ? 'Subiendo...' : 'Subir' }}</button>
                          <button class="btn-cancel" style="font-size:0.72rem;padding:0.3rem 0.6rem" (click)="generarEstructura(c)" [disabled]="generandoId === c.id">{{ generandoId === c.id ? 'Generando...' : 'IA Estructura' }}</button>
                          <button class="btn-cancel" style="font-size:0.72rem;padding:0.3rem 0.6rem;color:#f87171;border-color:rgba(239,68,68,0.2)" (click)="eliminarCursoReal(c)"><i class="fas fa-trash"></i></button>
                        </div>
                      </div>
                    </div>
                  } @empty {
                    @if (!cargandoCursos) { <p class="text-muted" style="grid-column:1/-1;text-align:center;padding:2rem">Aún no tienes cursos. ¡Crea el primero!</p> }
                  }
                </div>
              </section>
            }

            <!-- VISTA 4: REVISIONES -->
            @if (tabActual === 'entregas') {
              <section class="card-section">
                <div class="section-header">
                  <h3><i class="fas fa-tasks"></i> Revisiones y Actividades</h3>
                </div>

                <div class="table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Aprendiz</th>
                        <th>Actividad</th>
                        <th>Fecha de Entrega</th>
                        <th>Calificación</th>
                        <th class="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (e of entregas; track e.id) {
                        <tr>
                          <td><strong>{{ e.aprendiz }}</strong></td>
                          <td>{{ e.actividad }}</td>
                          <td><span class="text-muted">{{ e.fecha }}</span></td>
                          <td>
                            @if (e.estado === 'Calificado') {
                              <span class="note-tag">{{ e.nota }}/10</span>
                            } @else {
                              <span class="badge badge-warning">Sin Calificar</span>
                            }
                          </td>
                          <td class="text-right">
                            <button class="btn-cyan-glow btn-sm" (click)="calificarEntrega(e)">
                              Calificar
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            <!-- VISTA 5: SESIONES EN VIVO -->
            @if (tabActual === 'sesiones') {
              <section class="card-section">
                <div class="section-header">
                  <h3><i class="fas fa-video"></i> Sesiones en vivo</h3>
                </div>
                <div class="form-group">
                  <label>Curso (real)</label>
                  <select class="form-input" [(ngModel)]="nuevaSesion.courseId" (change)="cargarSesionesVivo()">
                    <option value="">-- Selecciona un curso --</option>
                    @for (c of cursosReales; track c._id) {
                      <option [value]="c._id">{{ c.titulo }} — {{ c.categoria }}</option>
                    }
                  </select>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;">
                  <div class="form-group"><label>Título de la sesión</label><input class="form-input" [(ngModel)]="nuevaSesion.titulo" placeholder="Ej. Clase en vivo #1" /></div>
                  <div class="form-group"><label>Fecha/hora</label><input type="datetime-local" class="form-input" [(ngModel)]="nuevaSesion.fechaInicioProgramada" /></div>
                </div>
                <div class="form-group"><label>URL reunión (opcional, Jitsi/Meet)</label><input class="form-input" [(ngModel)]="nuevaSesion.urlReunion" placeholder="https://meet.jit.si/..." /></div>
                <button class="btn-cyan-glow" (click)="crearSesionVivo()"><i class="fas fa-plus"></i> Crear sesión</button>
                @if (linkGenerado) {
                  <div style="margin-top:0.8rem;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:8px;padding:0.6rem 0.8rem;display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
                    <i class="fas fa-link" style="color:#06b6d4"></i>
                    <code style="font-size:0.75rem;word-break:break-all;flex:1">{{ linkGenerado }}</code>
                    <button class="btn-cancel" (click)="copiarLinkVivo(linkGenerado.split('/').pop()!)">Copiar</button>
                    <button class="btn-cyan-glow btn-sm" (click)="irASesionVivo(linkGenerado.split('/').pop()!)">Entrar</button>
                  </div>
                }
                <hr style="margin:1.2rem 0;border:none;border-top:1px solid rgba(255,255,255,0.06)" />
                <h4 style="font-size:0.9rem;margin:0 0 0.6rem"><i class="fas fa-list"></i> Sesiones del curso seleccionado</h4>
                @if (cargandoSesiones) { <p class="text-muted" style="font-size:0.8rem">Cargando…</p> }
                @if (sesionesVivo.length === 0 && !cargandoSesiones) { <p class="text-muted" style="font-size:0.8rem">Sin sesiones — crea la primera arriba.</p> }
                @for (s of sesionesVivo; track s._id) {
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.8rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;margin-bottom:0.5rem;flex-wrap:wrap;gap:0.5rem">
                    <div>
                      <strong style="font-size:0.85rem">{{ s.titulo }}</strong> <span class="badge" [ngClass]="{'badge-warning': s.estado==='programada','badge-success': s.estado==='en_curso','badge-danger': s.estado==='finalizada'}">{{ s.estado }}</span>
                      <br><small class="text-muted">{{ s.fechaInicioProgramada | date:'short' }} — {{ s._id }}</small>
                    </div>
                    <div style="display:flex;gap:0.4rem">
                      <button class="btn-cancel" (click)="copiarLinkVivo(s._id)" title="Copiar link"><i class="fas fa-link"></i></button>
                      <button class="btn-cyan-glow btn-sm" (click)="irASesionVivo(s._id)">Entrar</button>
                    </div>
                  </div>
                }
              </section>
            }

          </div>
        </main>

        <!-- Navbar Secundaria Lateral -->
        <aside class="side-navbar">
          <div class="nav-title">Navegación</div>
          <button 
            [class.active]="tabActual === 'dashboard'" 
            (click)="tabActual = 'dashboard'">
            <i class="fas fa-chart-pie"></i> Dashboard
          </button>
          <button 
            [class.active]="tabActual === 'aprendices'" 
            (click)="tabActual = 'aprendices'">
            <i class="fas fa-users"></i> Aprendices
          </button>
          <button 
            [class.active]="tabActual === 'cursos'" 
            (click)="tabActual = 'cursos'">
            <i class="fas fa-graduation-cap"></i> Cursos
          </button>
          <button 
            [class.active]="tabActual === 'entregas'" 
            (click)="tabActual = 'entregas'">
            <i class="fas fa-tasks"></i> Revisiones
          </button>
          <button 
            [class.active]="tabActual === 'sesiones'" 
            (click)="tabActual = 'sesiones'">
            <i class="fas fa-video"></i> Sesiones en vivo
          </button>
        </aside>

      </div>

      <!-- Modal Crear Curso -->
      @if (mostrarModalCurso) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3>Agregar Nuevo Curso</h3>
            <div class="form-group">
              <label>Nombre del Curso</label>
              <input type="text" [(ngModel)]="nuevoCurso.nombre" class="form-input" placeholder="Ej. Spring Boot API" />
            </div>
            <div class="form-group">
              <label>Descripción (mín. 10 caracteres)</label>
              <input type="text" [(ngModel)]="descripcionCurso" class="form-input" placeholder="Ej. API REST con Spring Boot y JWT" />
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <input type="text" [(ngModel)]="nuevoCurso.categoria" class="form-input" placeholder="Ej. Backend" />
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="mostrarModalCurso = false">Cancelar</button>
              <button class="btn-cyan-glow" (click)="guardarCurso()">Guardar Curso</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
      overflow: hidden;
      box-sizing: border-box;
    }

    .mentor-layout {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      background-color: #030308;
      overflow: hidden;
    }

    /* Fondo Constelación Animada - más visible */
    .constellation-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }

    .constellation-lines {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .constellation-node {
      position: absolute;
      width: 7px;
      height: 7px;
      background-color: #06b6d4;
      border-radius: 50%;
      box-shadow: 0 0 16px 4px #06b6d4;
      animation: nodePulse 4s ease-in-out infinite alternate;
    }

    .n1 { top: 20%; left: 15%; animation-delay: 0s; }
    .n2 { top: 60%; left: 45%; animation-delay: 1s; background-color: #3b82f6; box-shadow: 0 0 16px 4px #3b82f6; }
    .n3 { top: 30%; left: 80%; animation-delay: 2s; }
    .n4 { top: 80%; left: 70%; animation-delay: 1.5s; background-color: #8b5cf6; box-shadow: 0 0 16px 4px #8b5cf6; }
    .n5 { top: 75%; left: 25%; animation-delay: 0.5s; }
    .n6 { top: 65%; left: 10%; animation-delay: 2.5s; background-color: #8b5cf6; box-shadow: 0 0 16px 4px #8b5cf6; }
    .n7 { top: 60%; left: 90%; animation-delay: 3s; background-color: #3b82f6; box-shadow: 0 0 16px 4px #3b82f6; }

    @keyframes nodePulse {
      0% { transform: scale(0.9); opacity: 0.55; box-shadow: 0 0 10px 2px currentColor; }
      100% { transform: scale(2); opacity: 1; box-shadow: 0 0 26px 8px currentColor; }
    }

    /* Layout Principal Flex */
    .panel-body {
      display: flex;
      flex: 1;
      gap: 1.5rem;
      padding: 1.5rem;
      overflow: hidden;
      align-items: stretch;
      position: relative;
      z-index: 10;
    }

    .main-content {
      flex: 1;
      min-width: 0;
      height: 100%;
      overflow-y: auto;
      padding-right: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .content-limiter {
      width: 100%;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .section-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: center;
    }

    /* Scrollbar */
    .main-content::-webkit-scrollbar {
      width: 5px;
    }
    .main-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    .main-content::-webkit-scrollbar-thumb:hover {
      background: rgba(6, 182, 212, 0.4);
    }

    /* Navbar Secundaria Lateral */
    .side-navbar {
      width: 230px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      background-color: rgba(12, 12, 20, 0.75);
      padding: 1.25rem;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      flex-shrink: 0;
      box-sizing: border-box;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .nav-title {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 0.5rem;
      padding-left: 0.5rem;
      font-weight: 700;
    }

    .side-navbar button {
      background: none;
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 0.8rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s ease;
      text-align: left;
    }

    .side-navbar button:hover {
      color: #ffffff;
      background-color: rgba(255, 255, 255, 0.03);
    }

    .side-navbar button.active {
      color: #ffffff;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15));
      border-color: rgba(6, 182, 212, 0.3);
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.1);
    }

    .side-navbar button.active i {
      color: #06b6d4;
    }

    /* Tarjetas de Secciones */
    .card-section {
      background-color: rgba(12, 12, 20, 0.75);
      border-radius: 14px;
      padding: 1.75rem;
      border: 1px solid rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      min-height: min-content; 
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .section-header h3 i {
      color: #06b6d4;
    }

    /* Buscador e Inputs */
    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      color: #64748b;
      font-size: 0.8rem;
    }

    .search-input {
      background-color: rgba(8, 8, 14, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #f8fafc;
      padding: 0.55rem 0.85rem 0.55rem 2.25rem;
      border-radius: 9px;
      outline: none;
      font-size: 0.85rem;
      width: 240px;
      transition: all 0.2s ease;
    }

    .search-input:focus, .form-input:focus {
      border-color: #06b6d4;
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.15);
    }

    .form-input {
      background-color: rgba(8, 8, 14, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #f8fafc;
      padding: 0.6rem 0.9rem;
      border-radius: 9px;
      outline: none;
      font-size: 0.875rem;
      width: 100%;
      box-sizing: border-box;
    }

    /* Tablas adaptables */
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      background-color: rgba(8, 8, 14, 0.9);
      color: #94a3b8;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.9rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-weight: 600;
    }

    .data-table td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
      font-size: 0.875rem;
    }

    .data-table tbody tr {
      transition: background-color 0.15s ease;
    }

    .data-table tbody tr:hover {
      background-color: rgba(255, 255, 255, 0.02);
    }

    .text-right { text-align: right; }
    .text-muted { color: #94a3b8; }

    /* Badges */
    .badge {
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      display: inline-block;
      letter-spacing: 0.02em;
    }

    .badge-warning {
      background-color: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    .badge-success {
      background-color: rgba(34, 197, 94, 0.1);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.25);
    }

    .badge-danger {
      background-color: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.78rem;
    }

    .btn-icon {
      background: none;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35rem;
      transition: all 0.15s ease;
    }

    .btn-approve {
      background-color: rgba(34, 197, 94, 0.1);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .btn-approve:hover { background-color: rgba(34, 197, 94, 0.25); }

    .btn-reject {
      background-color: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .btn-reject:hover { background-color: rgba(239, 68, 68, 0.25); }

    /* Grilla de Cursos */
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .course-card {
      background-color: rgba(8, 8, 14, 0.6);
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s ease;
    }

    .course-card:hover {
      transform: translateY(-2px);
      border-color: rgba(6, 182, 212, 0.3);
    }

    .course-card h4 {
      margin: 0 0 0.4rem 0;
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .course-card .category {
      font-size: 0.78rem;
      color: #94a3b8;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .course-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      color: #cbd5e1;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .note-tag {
      font-weight: 700;
      color: #4ade80;
      background: rgba(34, 197, 94, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .btn-cyan-glow {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #030308;
      border: none;
      padding: 0.45rem 1.25rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
    }

    .btn-cyan-glow:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 25px rgba(6, 182, 212, 0.5);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .modal-card {
      background-color: #0e0e16;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 2rem;
      border-radius: 16px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    }

    .modal-card h3 {
      margin-top: 0;
      margin-bottom: 1.25rem;
      color: #ffffff;
      font-size: 1.15rem;
    }

    .form-group {
      margin-bottom: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-group label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .btn-cancel {
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 0.55rem 1.1rem;
      border-radius: 9px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #ffffff;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 900px) {
      .panel-body { flex-direction: column; gap: 1rem; padding: 1rem 1rem 6rem 1rem; }
      .main-content { padding-right: 0; }
      .side-navbar { width: 100%; height: auto; flex-direction: row; flex-wrap: wrap; gap: 0.5rem; padding: 0.8rem; border-radius: 12px; justify-content: flex-start; overflow-x: auto; }
      .side-navbar .nav-title { display: none; }
      .side-navbar button { flex: 0 0 auto; padding: 0.6rem 0.9rem; font-size: 0.82rem; }
      .courses-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.9rem; }
      .card-section { padding: 1.1rem; }
      .data-table { min-width: 520px; }
    }

    @media (max-width: 480px) {
      .panel-body { padding: 0.75rem 0.75rem 6rem 0.75rem; }
      .section-header { flex-direction: column; align-items: stretch; }
      .search-input { width: 100%; min-width: 0; }
      .courses-grid { grid-template-columns: 1fr; }
      .side-navbar { gap: 0.4rem; padding: 0.6rem; }
      .side-navbar button { flex: 1 1 auto; justify-content: center; padding: 0.55rem 0.7rem; font-size: 0.78rem; }
      .table-wrapper { margin: 0 -0.3rem; border-radius: 8px; }
      .btn-cyan-glow, .btn-cancel { width: 100%; justify-content: center; }
      .modal-card { margin: 1rem; padding: 1.4rem; }
      .form-input { font-size: 16px; }
    }
  `]
})
export class MentorPageComponent implements OnInit {
  tabActual: 'dashboard' | 'aprendices' | 'cursos' | 'entregas' | 'sesiones' = 'dashboard';
  filtroAprendiz: string = '';
  mostrarModalCurso: boolean = false;

  // --- Sesiones en vivo ---
  sesionesVivo: LiveSession[] = [];
  cursosReales: import('../../models/curso.model').Curso[] = [];
  nuevaSesion = { courseId: '', titulo: '', fechaInicioProgramada: '', urlReunion: '' };
  linkGenerado: string | null = null;
  cargandoSesiones = false;
  cargandoCursos = false;
  errorCursos: string | null = null;
  archivoPDF: File | null = null;
  subiendoPDF = false;
  generandoId: number | null = null;
  cursoSeleccionadoId: string | null = null;
  descripcionCurso = '';

  nuevoCurso: Partial<Curso> = { nombre: '', categoria: '' };

  cursos: Curso[] = [
    { id: 1, nombre: 'Análisis y Desarrollo de Software', categoria: 'Programación', estado: 'Activo', alumnos: 24 },
    { id: 2, nombre: 'Bases de Datos Relacionales', categoria: 'Bases de Datos', estado: 'Activo', alumnos: 18 },
    { id: 3, nombre: 'Arquitectura Web Frontend', categoria: 'Frontend', estado: 'Activo', alumnos: 15 }
  ];

  aprendices: Aprendiz[] = [
    { id: 101, nombre: 'Juan Pérez', curso: 'ADSO', novedad: 'Entrega Taller 1', estado: 'Pendiente' },
    { id: 102, nombre: 'María López', curso: 'ADSO', novedad: 'Proyecto Final', estado: 'Aprobado' },
    { id: 103, nombre: 'Carlos Ruiz', curso: 'Bases de Datos', novedad: 'Quiz 2', estado: 'Pendiente' },
    { id: 104, nombre: 'Ana Gómez', curso: 'Frontend', novedad: 'Sustentación', estado: 'No Aprobado' }
  ];

  entregas: Entrega[] = [
    { id: 1, aprendiz: 'Juan Pérez', actividad: 'Taller 1: Modelado ER', fecha: '2026-09-01', estado: 'Pendiente' },
    { id: 2, aprendiz: 'María López', actividad: 'Caso de Estudio MEAN', fecha: '2026-09-03', estado: 'Calificado', nota: 9.5 },
    { id: 3, aprendiz: 'Carlos Ruiz', actividad: 'Script SQL Normalización', fecha: '2026-09-05', estado: 'Pendiente' }
  ];

  diasSemana: DiaSemana[] = [
    { dia: 'Lunes', entregas: 12, porcentaje: 60 },
    { dia: 'Martes', entregas: 18, porcentaje: 90 },
    { dia: 'Miércoles', entregas: 8, porcentaje: 40 },
    { dia: 'Jueves', entregas: 15, porcentaje: 75 },
    { dia: 'Viernes', entregas: 20, porcentaje: 100 }
  ];

  get aprendicesFiltrados(): Aprendiz[] {
    return this.aprendices.filter(a =>
      a.nombre.toLowerCase().includes(this.filtroAprendiz.toLowerCase()) ||
      a.curso.toLowerCase().includes(this.filtroAprendiz.toLowerCase())
    );
  }

  calcularTasaAprobacion(): number {
    if (this.aprendices.length === 0) return 0;
    const aprobados = this.aprendices.filter(a => a.estado === 'Aprobado').length;
    return Math.round((aprobados / this.aprendices.length) * 100);
  }

  contarPendientes(): number {
    return this.aprendices.filter(a => a.estado === 'Pendiente').length;
  }

  obtenerTotalEntregasSemana(): number {
    return this.diasSemana.reduce((total, dia) => total + dia.entregas, 0);
  }

  cambiarEstadoAprendiz(id: number, nuevoEstado: 'Aprobado' | 'No Aprobado'): void {
    const aprendiz = this.aprendices.find(a => a.id === id);
    if (aprendiz) {
      aprendiz.estado = nuevoEstado;
    }
  }

  abrirModalCurso(): void {
    this.nuevoCurso = { nombre: '', categoria: '' };
    this.mostrarModalCurso = true;
  }

  guardarCurso(): void {
    const titulo = this.nuevoCurso.nombre?.trim();
    const categoria = this.nuevoCurso.categoria?.trim();
    const descripcion = this.descripcionCurso.trim() || `Curso de ${categoria}`;
    if (!titulo || !categoria) {
      alert('Completa título y categoría');
      return;
    }
    this.cursoServiceReal.crearCurso({ titulo, descripcion, categoria }).subscribe({
      next: () => {
        this.mostrarModalCurso = false;
        this.nuevoCurso = { nombre: '', categoria: '' };
        this.descripcionCurso = '';
        this.cargarMisCursos();
      },
      error: (err) => alert(err.error?.error?.message || 'No se pudo crear el curso'),
    });
  }

  onArchivoSeleccionado(event: Event, curso: any): void {
    const input = event.target as HTMLInputElement;
    this.archivoPDF = input.files?.[0] ?? null;
    this.cursoSeleccionadoId = curso._id || curso.id;
  }

  subirPDF(curso: any): void {
    if (!this.archivoPDF || !curso._id) {
      alert('Selecciona un PDF primero');
      return;
    }
    this.subiendoPDF = true;
    this.cursoServiceReal.subirDocumento(curso._id, this.archivoPDF).subscribe({
      next: (res) => {
        this.subiendoPDF = false;
        alert(`PDF procesado: ${res.vistaPrevia?.totalFragmentos ?? 0} fragmentos`);
        this.archivoPDF = null;
        this.cargarMisCursos();
      },
      error: (err) => {
        this.subiendoPDF = false;
        alert(err.error?.error?.message || 'Error al subir PDF');
      },
    });
  }

  generarEstructura(curso: any): void {
    const id = curso._id || curso.id;
    this.generandoId = curso.id;
    this.cursoServiceReal.generarEstructuraCurso(id).subscribe({
      next: () => {
        this.generandoId = null;
        alert('Estructura generada con IA');
        this.cargarMisCursos();
      },
      error: (err) => {
        this.generandoId = null;
        alert(err.error?.error?.message || 'No se pudo generar (necesita PDF previo)');
      },
    });
  }

  cambiarEstadoCursoReal(curso: any, nuevoEstado: 'borrador' | 'publicado' | 'archivado'): void {
    const id = curso._id || curso.id;
    this.cursoServiceReal.cambiarEstadoCurso(id, nuevoEstado).subscribe({
      next: () => this.cargarMisCursos(),
      error: (err) => alert(err.error?.error?.message || 'No se pudo cambiar estado'),
    });
  }

  eliminarCursoReal(curso: any): void {
    if (!confirm(`¿Eliminar "${curso.nombre || curso.titulo}"?`)) return;
    const id = curso._id || curso.id;
    this.cursoServiceReal.eliminarCurso(id).subscribe({
      next: () => this.cargarMisCursos(),
      error: (err) => alert(err.error?.error?.message || 'No se pudo eliminar'),
    });
  }

  calificarEntrega(entrega: Entrega): void {
    const notaPrompt = prompt(`Ingrese la nota para ${entrega.aprendiz} (0 al 10):`, '8.0');
    if (notaPrompt !== null) {
      const notaNum = parseFloat(notaPrompt);
      if (!isNaN(notaNum) && notaNum >= 0 && notaNum <= 10) {
        entrega.nota = notaNum;
        entrega.estado = 'Calificado';
      }
    }
  }

  // --- Sesiones en vivo (backend real) ---
  constructor(private liveSessionService: LiveSessionService, private cursoServiceReal: CursoService, private router: Router) {}

  ngOnInit(): void {
    this.cargarMisCursos();
    // Carga cursos para selector de sesiones (usa los mismos mis-cursos)
    this.cursoServiceReal.obtenerMisCursos().subscribe({
      next: (cursos) => (this.cursosReales = cursos),
      error: () => (this.cursosReales = []),
    });
  }

  cargarMisCursos(): void {
    this.cargandoCursos = true;
    this.errorCursos = null;
    this.cursoServiceReal.obtenerMisCursos().subscribe({
      next: (reales) => {
        this.cursosReales = reales;
        // Mapea al formato mock para que el template y dashboard-quick sigan funcionando
        this.cursos = reales.map((r) => ({
          id: parseInt(r._id!.slice(-6), 16),
          nombre: r.titulo,
          categoria: r.categoria,
          estado: r.estado === 'publicado' ? 'Activo' : 'Inactivo',
          alumnos: (r as any).inscritos?.length ?? 0,
          _id: r._id,
          descripcion: r.descripcion,
          bot: r.bot,
        })) as any;
        this.cargandoCursos = false;
        // Actualiza aprendices derivados de inscritos reales
        this.refrescarAprendicesDesdeCursos();
      },
      error: (err) => {
        this.errorCursos = err.error?.error?.message || 'No se pudieron cargar tus cursos';
        this.cargandoCursos = false;
      },
    });
  }

  private refrescarAprendicesDesdeCursos(): void {
    const mapa = new Map<number, Aprendiz>();
    for (const c of this.cursosReales) {
      for (const ins of (c as any).inscritos ?? []) {
        const idNum = parseInt((ins.id || ins._id || '').slice(-6), 16) || Date.now() + Math.random();
        if (!mapa.has(idNum)) {
          mapa.set(idNum, {
            id: idNum,
            nombre: ins.nombre,
            curso: c.titulo,
            novedad: 'Inscrito',
            estado: 'Pendiente',
          });
        }
      }
    }
    if (mapa.size > 0) {
      const reales = Array.from(mapa.values());
      // Combina con los mock si no hay duplicados
      const existentes = new Set(this.aprendices.map((a) => a.nombre));
      for (const r of reales) if (!existentes.has(r.nombre)) this.aprendices.push(r);
    }
  }

  crearSesionVivo(): void {
    if (!this.nuevaSesion.courseId || !this.nuevaSesion.titulo || !this.nuevaSesion.fechaInicioProgramada) {
      alert('Completa curso, título y fecha');
      return;
    }
    this.liveSessionService.crear(this.nuevaSesion).subscribe({
      next: (s) => {
        this.linkGenerado = this.liveSessionService.generarLink(s._id);
        this.sesionesVivo.unshift(s);
        alert('Sesión creada. Link: ' + this.linkGenerado);
      },
      error: (err) => alert(err.error?.error?.message || 'No se pudo crear la sesión'),
    });
  }

  copiarLinkVivo(id: string): void {
    const link = this.liveSessionService.generarLink(id);
    navigator.clipboard.writeText(link);
    this.linkGenerado = link;
  }

  irASesionVivo(id: string): void {
    this.router.navigate(['/sesion', id]);
  }

  cargarSesionesVivo(): void {
    if (!this.nuevaSesion.courseId) return;
    this.cargandoSesiones = true;
    this.liveSessionService.listarPorCurso(this.nuevaSesion.courseId).subscribe({
      next: (sesiones) => { this.sesionesVivo = sesiones; this.cargandoSesiones = false; },
      error: () => { this.cargandoSesiones = false; },
    });
  }
}