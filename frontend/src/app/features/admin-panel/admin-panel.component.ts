import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminDashboardQuickComponent, CursosPorEstado } from './admin-dashboard-quick.component';
import { AdminService } from '../../core/services/admin.service';
import { SidebarComponent, SidebarSection } from '../../shared/components/sidebar/sidebar.component';
import {
  CursoApi,
  EstadoCurso,
  MesDato,
  RolUsuario,
  UsuarioApi
} from '../../models/admin.models';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDashboardQuickComponent, SidebarComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPageComponent implements OnInit {
  tabActual: 'dashboard' | 'usuarios' | 'cursos' | 'inscripciones' = 'dashboard';

  menuLateral: SidebarSection[] = [
    {
      key: 'panel',
      label: 'PANEL',
      icon: 'fas fa-chart-pie',
      items: [{ key: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' }],
    },
    {
      key: 'formacion',
      label: 'FORMACIÓN',
      icon: 'fas fa-graduation-cap',
      items: [
        { key: 'cursos', label: 'Cursos', icon: 'fas fa-book-open' },
        { key: 'inscripciones', label: 'Inscripciones', icon: 'fas fa-tasks' },
      ],
    },
    {
      key: 'comunidad',
      label: 'COMUNIDAD',
      icon: 'fas fa-users',
      items: [{ key: 'usuarios', label: 'Usuarios', icon: 'fas fa-users-cog' }],
    },
  ];

  cambiarTab(tab: string): void {
    if (tab === 'dashboard' || tab === 'usuarios' || tab === 'cursos' || tab === 'inscripciones') {
      this.tabActual = tab;
    }
  }

  cargando = true;
  error: string | null = null;

  usuarios: UsuarioApi[] = [];
  cursos: CursoApi[] = [];
  resumen: { administrador: number; mentor: number; aprendiz: number; total: number } | null = null;

  filtroUsuario = '';
  filtroRol: '' | RolUsuario = '';

  mostrarModalCurso = false;
  mostrarModalUsuario = false;
  nuevoCurso = { titulo: '', descripcion: '', categoria: '', mentor: '', precio: 0 };
  nuevoUsuario = { nombre: '', email: '', contrasena: '', rol: 'aprendiz' as RolUsuario };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando = true;
    this.error = null;

    forkJoin({
      usuarios: this.adminService.listarUsuarios({ limite: 200 }),
      resumen: this.adminService.resumenRoles(),
      cursos: this.adminService.listarTodosCursos()
    }).subscribe({
      next: ({ usuarios, resumen, cursos }) => {
        this.usuarios = usuarios.usuarios;
        this.resumen = resumen;
        this.cursos = cursos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo conectar con el backend (http://localhost:4000). Verifica que esté corriendo.';
        this.cargando = false;
      }
    });
  }

  // ---------- Derivados para el dashboard ----------
  get cursosPorEstado(): CursosPorEstado {
    return {
      total: this.cursos.length,
      publicado: this.cursos.filter(c => c.estado === 'publicado').length,
      borrador: this.cursos.filter(c => c.estado === 'borrador').length,
      archivado: this.cursos.filter(c => c.estado === 'archivado').length
    };
  }

  get totalInscripciones(): number {
    return this.cursos.reduce((t, c) => t + (c.inscritos?.length ?? 0), 0);
  }

  get usuariosActivos(): number {
    return this.usuarios.filter(u => u.activo).length;
  }

  get crecimientoMensual(): MesDato[] {
    const ahora = new Date();
    const cubetas: { etiqueta: string; total: number }[] = [];

    for (let i = 4; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      cubetas.push({ etiqueta: `${MESES_CORTO[fecha.getMonth()]} ${fecha.getFullYear()}`, total: 0 });
    }

    for (const u of this.usuarios) {
      const creada = new Date(u.createdAt);
      const clave = `${MESES_CORTO[creada.getMonth()]} ${creada.getFullYear()}`;
      const cubeta = cubetas.find(c => c.etiqueta === clave);
      if (cubeta) cubeta.total++;
    }

    const maximo = Math.max(1, ...cubetas.map(c => c.total));
    return cubetas.map(c => ({
      mes: c.etiqueta,
      usuarios: c.total,
      porcentaje: Math.round((c.total / maximo) * 100)
    }));
  }

  // ---------- Usuarios ----------
  get usuariosFiltrados(): UsuarioApi[] {
    const texto = this.filtroUsuario.toLowerCase();
    return this.usuarios.filter(u =>
      (!this.filtroRol || u.rol === this.filtroRol) &&
      (u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto))
    );
  }

  cambiarRol(id: string, rol: RolUsuario): void {
    this.adminService.cambiarRol(id, rol).subscribe({
      next: actualizada => {
        const local = this.usuarios.find(u => u._id === id);
        if (local) local.rol = actualizada.rol;
        this.refrescarResumen();
      },
      error: () => this.error = 'No se pudo cambiar el rol.'
    });
  }

  toggleActivo(usuario: UsuarioApi): void {
    this.adminService.cambiarEstado(usuario._id, !usuario.activo).subscribe({
      next: actualizada => { usuario.activo = actualizada.activo; },
      error: () => this.error = 'No se pudo cambiar el estado.'
    });
  }

  private refrescarResumen(): void {
    this.adminService.resumenRoles().subscribe({
      next: r => this.resumen = r,
      error: () => undefined
    });
  }

  // ---------- Cursos ----------
  get mentoresDisponibles(): UsuarioApi[] {
    return this.usuarios.filter(u => u.rol === 'mentor' && u.activo);
  }

  abrirModalUsuario(): void {
    this.nuevoUsuario = { nombre: '', email: '', contrasena: '', rol: 'aprendiz' };
    this.mostrarModalUsuario = true;
  }

  guardarUsuario(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email || !this.nuevoUsuario.contrasena) return;
    this.adminService.crearUsuario({ ...this.nuevoUsuario}).subscribe({
      next: creado => {
        this.usuarios = [creado, ...this.usuarios];
        this.mostrarModalUsuario = false;
        this.refrescarResumen();
      },
      error: () => this.error = 'No se pudo crear el usuario (verifica que el correo no exista).'
    });
  }

  nombreMentor(curso: CursoApi): string {
    if (!curso.mentor) return 'Sin asignar';
    return typeof curso.mentor === 'string' ? curso.mentor : curso.mentor.nombre;
  }

  abrirModalCurso(): void {
    this.nuevoCurso = { titulo: '', descripcion: '', categoria: '', mentor: '', precio: 0 };
    this.mostrarModalCurso = true;
  }

  guardarCurso(): void {
    if (!this.nuevoCurso.titulo || !this.nuevoCurso.descripcion || !this.nuevoCurso.categoria || !this.nuevoCurso.mentor) return;
    this.adminService.crearCurso({ ...this.nuevoCurso }).subscribe({
      next: creado => {
        this.cursos = [creado, ...this.cursos];
        this.mostrarModalCurso = false;
      },
      error: () => this.error = 'No se pudo crear el curso.'
    });
  }

  cambiarEstadoCurso(curso: CursoApi, estado: EstadoCurso): void {
    this.adminService.cambiarEstadoCurso(curso._id, estado).subscribe({
      next: actualizado => { curso.estado = actualizado.estado; },
      error: () => this.error = 'No se pudo cambiar el estado del curso.'
    });
  }

  eliminarCurso(id: string): void {
    if (!confirm('¿Eliminar este curso? (baja lógica, se puede revertir en BD)')) return;
    this.adminService.eliminarCurso(id).subscribe({
      next: () => { this.cursos = this.cursos.filter(c => c._id !== id); },
      error: () => this.error = 'No se pudo eliminar el curso.'
    });
  }
}
