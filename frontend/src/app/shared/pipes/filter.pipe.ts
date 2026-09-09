import { Pipe, PipeTransform } from '@angular/core';

/**
 * Filtra un arreglo de objetos por coincidencia de texto en cualquiera de sus propiedades.
 * Uso: *ngFor="let item of items | filter:texto"
 */
@Pipe({ name: 'filter', standalone: true })
export class FilterPipe implements PipeTransform {
  transform(items: any[], term: string): any[] {
    if (!items) return [];
    if (!term) return items;
    const t = term.toLowerCase();
    return items.filter(item =>
      Object.values(item).some(valor => String(valor).toLowerCase().includes(t))
    );
  }
}
