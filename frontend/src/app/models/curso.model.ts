export interface Curso {
  _id?: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  mentor?: { _id: string; nombre: string };
  portadaUrl?: string;
  estado?: 'borrador' | 'publicado' | 'archivado';
  precio: number;
  duracionEstimadaHoras?: number;
  contenidoTextoPlano?: string;
  modulos?: any[];
  bot?: {
    entrenado?: boolean;
    fechaEntrenamiento?: Date;
    documentoOrigenNombre?: string;
    totalChunks?: number;
  };
  activo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
