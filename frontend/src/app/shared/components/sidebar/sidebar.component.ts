import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SidebarItem {
  key: string;
  label: string;
  icon: string;
}

export interface SidebarSection {
  key: string;
  label: string;
  icon: string;
  items: SidebarItem[];
}

/**
 * Sidebar estilo MongoDB Atlas adaptado a MentorSync.
 * Rail de 56px siempre visible (solo iconos) + panel 280px que se revela al hover.
 * Agrupado por secciones colapsables (PANEL / ACADÉMICA / COMUNIDAD / SISTEMA).
 * Glassmorphism, 100vh, auto-hide.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  // Nueva API por secciones (recomendada)
  sections = input<SidebarSection[]>([]);
  // API legacy plana (se convierte a una sola sección)
  items = input<SidebarItem[]>([]);
  active = input<string>('');
  title = input<string>('MentorSync AI');

  seleccionar = output<string>();

  // Estado colapsado por sección (true = expandida)
  expanded = signal<Record<string, boolean>>({});

  elegir(key: string): void {
    this.seleccionar.emit(key);
  }

  toggleSection(key: string): void {
    const cur = this.expanded();
    this.expanded.set({ ...cur, [key]: !(cur[key] ?? true) });
  }

  isExpanded(key: string): boolean {
    return this.expanded()[key] ?? true;
  }

  // Secciones efectivas: si viene `sections` úsala, si no, agrupa `items` en una sola
  get effectiveSections(): SidebarSection[] {
    const secs = this.sections();
    if (secs && secs.length) return secs;
    const flat = this.items();
    if (flat.length) return [{ key: 'general', label: '', icon: '', items: flat }];
    return [];
  }

  // Rail colapsado: solo iconos de sección (Formación, Comunidad),
  // no todos los items internos. Al pasar el mouse se ven los hijos.
  get railSections(): SidebarSection[] {
    // Si hay secciones con label (modo Atlas), muestra solo las agrupadas
    const secs = this.effectiveSections.filter((s) => s.key !== 'panel');
    if (secs.length && secs.some((s) => s.label)) return secs;
    // Fallback legacy: una sola sección sin label -> muestra sus items como rail
    return [];
  }

  // Fallback para cuando no hay secciones etiquetadas: items planos
  get railItems(): SidebarItem[] {
    if (this.railSections.length) return [];
    return this.effectiveSections.flatMap((s) => s.items);
  }

  isSectionActive(section: SidebarSection): boolean {
    return section.items.some((i) => i.key === this.active());
  }

  elegirSeccion(section: SidebarSection): void {
    // Al hacer click en el icono de sección colapsada, navega al primer item de esa sección
    if (section.items.length) this.elegir(section.items[0].key);
    // Y asegura que la sección quede expandida al abrirse el panel
    const cur = this.expanded();
    if (cur[section.key] === false) this.expanded.set({ ...cur, [section.key]: true });
  }
}
