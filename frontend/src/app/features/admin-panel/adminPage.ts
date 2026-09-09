import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from '../../shared/pipes/filter.pipe';

@Component({
  selector: 'app-adminPage',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  template: `
    <header class="toolbar">
      <button class="icon-btn">👤 Perfil</button>
    </header>

    <section>
      <h2>Aprendices registrados</h2>
      <input type="text" placeholder="Buscar por nombre o correo..." [(ngModel)]="searchAprendiz"/>
      <table>
        <tr><th>Nombre</th><th>Curso</th></tr>
        <tr *ngFor="let a of aprendices | filter:searchAprendiz">
          <td>{{a.nombre}}</td>
          <td>{{a.curso}}</td>
        </tr>
      </table>
    </section>

    <section>
      <h2>Mentores registrados</h2>
      <input type="text" placeholder="Buscar por nombre o correo..." [(ngModel)]="searchMentor"/>
      <table>
        <tr><th>Nombre</th><th>Cursos</th><th>Acción</th></tr>
        <tr *ngFor="let m of mentores | filter:searchMentor">
          <td>{{m.nombre}}</td>
          <td>{{m.cursos}}</td>
          <td>
            <button>Asignar curso</button>
            <button>Quitar curso</button>
          </td>
        </tr>
      </table>
    </section>

    <section>
      <h2>Dashboard Administrador</h2>
      <!-- Gráficas globales -->
    </section>
  `,
  styles: [`
    .toolbar { display: flex; justify-content: flex-end; gap: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; }
  `]
})
export class AdminPageComponent {
  searchAprendiz = '';
  searchMentor = '';
  aprendices = [{nombre:'Pedro Gómez', curso:'Angular Básico'}];
  mentores = [{nombre:'María López', cursos:'Laravel Avanzado'}];
}
