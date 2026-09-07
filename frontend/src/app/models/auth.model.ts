// auth.model.ts

export interface UsuarioLoginReq {
  correo: string;
  contrasena: string;
}

export interface UsuarioRegistroReq {
  nombre: string;
  correo: string;
  contrasena: string;
  rol?: string; // Opcional, según lo que espere tu backend
}

export interface AuthRespuesta {
  exito: boolean;
  mensaje?: string;
  token?: string;
  usuario?: {
    id: string;
    nombre: string;
    correo: string;
  };
}