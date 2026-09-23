// Tipos alineados al backend MEAN (ver backend/src/models/*).
// Los IDs son ObjectId en string, los roles en minúsculas en español
// y el estado de usuario es el booleano `activo`.
export type RolUsuario = 'administrador' | 'mentor' | 'aprendiz';
export type EstadoCurso = 'borrador' | 'publicado' | 'archivado';

export interface UsuarioApi {
  _id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InscritoApi {
  _id?: string;
  id?: string;
  nombre: string;
  correo: string;
}

export interface CursoApi {
  _id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  mentor?: { _id: string; nombre: string; email?: string } | string;
  estado: EstadoCurso;
  precio: number;
  inscritos: InscritoApi[];
  activo: boolean;
  createdAt: string;
}

export interface ResumenRoles {
  administrador: number;
  mentor: number;
  aprendiz: number;
  total: number;
}

export interface MesDato {
  mes: string;
  usuarios: number;
  porcentaje: number;
}

export interface RespuestaApi<T> {
  success: boolean;
  message?: string;
  data: T;
}
