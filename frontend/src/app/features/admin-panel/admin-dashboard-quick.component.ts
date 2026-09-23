import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MesDato, ResumenRoles } from '../../models/admin.models';

export interface CursosPorEstado {
  total: number;
  publicado: number;
  borrador: number;
  archivado: number;
}

@Component({
  selector: 'app-admin-dashboard-quick',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard-quick.component.html',
  styleUrl: './admin-dashboard-quick.component.css'
})
export class AdminDashboardQuickComponent {
  @Input() resumen: ResumenRoles | null = null;
  @Input() cursos: CursosPorEstado = { total: 0, publicado: 0, borrador: 0, archivado: 0 };
  @Input() totalInscripciones = 0;
  @Input() usuariosActivos = 0;
  @Input() crecimiento: MesDato[] = [];

  get totalUsuarios(): number {
    return this.resumen?.total ?? 0;
  }

  get pctAprendices(): number {
    if (!this.totalUsuarios || !this.resumen) return 0;
    return Math.round((this.resumen.aprendiz / this.totalUsuarios) * 100);
  }

  get pctMentores(): number {
    if (!this.totalUsuarios || !this.resumen) return 0;
    return Math.round((this.resumen.mentor / this.totalUsuarios) * 100);
  }

  get pctAdmins(): number {
    if (!this.totalUsuarios || !this.resumen) return 0;
    return Math.round((this.resumen.administrador / this.totalUsuarios) * 100);
  }

  get donutGradient(): string {
    const a = this.pctAprendices;
    const m = this.pctMentores;
    return `conic-gradient(#06b6d4 0 ${a}%, #a855f7 ${a}% ${a + m}%, #ec4899 ${a + m}% 100%)`;
  }

  get pctActivos(): number {
    if (!this.totalUsuarios) return 0;
    return Math.round((this.usuariosActivos / this.totalUsuarios) * 100);
  }

  get pctPublicados(): number {
    if (!this.cursos.total) return 0;
    return Math.round((this.cursos.publicado / this.cursos.total) * 100);
  }
}
