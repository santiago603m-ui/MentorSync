import mongoose from 'mongoose';
import usuarioService from '../services/user.service.js';

/**
 * Controller de administración de usuarios. Solo accesible con rol administrador.
 * Regla del proyecto: el controller SOLO recibe/responde HTTP.
 */
class UsuarioController {
  async listar(req, res, next) {
    try {
      const { rol, busqueda, pagina, limite } = req.query;
      const resultado = await usuarioService.listarUsuarios({ rol, busqueda, pagina, limite });
      return res.status(200).json({
        success: true,
        message: 'Usuarios obtenidos correctamente',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  async resumen(req, res, next) {
    try {
      const resumen = await usuarioService.resumenRoles();
      return res.status(200).json({
        success: true,
        message: 'Resumen de usuarios obtenido correctamente',
        data: { resumen },
      });
    } catch (error) {
      next(error);
    }
  }

  async crear(req, res, next) {
    try {
      const usuario = await usuarioService.crearUsuario(req.body);
      return res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: { usuario },
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarRol(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido', data: null });
      }

      const usuario = await usuarioService.cambiarRol(id, req.body.rol, req.usuario.id);
      return res.status(200).json({
        success: true,
        message: 'Rol actualizado correctamente',
        data: { usuario },
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido', data: null });
      }

      const usuario = await usuarioService.cambiarEstado(id, req.body.activo, req.usuario.id);
      return res.status(200).json({
        success: true,
        message: 'Estado actualizado correctamente',
        data: { usuario },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsuarioController();
