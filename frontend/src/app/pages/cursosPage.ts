import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cursos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos-page.html',
  styleUrls: ['./cursos-page.css']
})
export class CursosPageComponent {
  searchTerm = '';
  selectedCategory = '';
  selectedLevel = '';
  selectedOrder = 'recent';

  cursos = [
    { nombre: 'Angular Básico', categoria: 'frontend', nivel: 'principiante', precio: 50, popularidad: 90, rating: 4.5, fecha: new Date(2026, 7, 1) },
    { nombre: 'Node.js Avanzado', categoria: 'backend', nivel: 'avanzado', precio: 120, popularidad: 70, rating: 4.8, fecha: new Date(2026, 6, 15) },
    { nombre: 'Machine Learning Intro', categoria: 'ai', nivel: 'intermedio', precio: 80, popularidad: 85, rating: 4.6, fecha: new Date(2026, 5, 20) }
  ];

  filteredCourses() {
    let result = this.cursos.filter(curso =>
      curso.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
      (this.selectedCategory ? curso.categoria === this.selectedCategory : true) &&
      (this.selectedLevel ? curso.nivel === this.selectedLevel : true)
    );

    switch (this.selectedOrder) {
      case 'recent': result = result.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()); break;
      case 'old': result = result.sort((a, b) => a.fecha.getTime() - b.fecha.getTime()); break;
      case 'popular': result = result.sort((a, b) => b.popularidad - a.popularidad); break;
      case 'rated': result = result.sort((a, b) => b.rating - a.rating); break;
      case 'priceAsc': result = result.sort((a, b) => a.precio - b.precio); break;
      case 'priceDesc': result = result.sort((a, b) => b.precio - a.precio); break;
    }

    return result;
  }
}
