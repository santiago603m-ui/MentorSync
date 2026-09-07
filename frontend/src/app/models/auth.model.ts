export interface UsuarioLoginReq {
  email: string;
  contraseña: string; // 👈 clave que espera el backend
}

export interface UsuarioRegistroReq {
  nombre: string;
  email: string;
  contraseña: string;
  rol?: string;
}

export interface AuthRespuesta {
  success: boolean;
  message?: string;
  data: {
    token: string;
    usuario: {
      id: string;
      nombre: string;
      email: string;
      rol?: string;
    };
  };
}
