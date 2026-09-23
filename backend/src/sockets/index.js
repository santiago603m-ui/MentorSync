import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import chatMessageRepository from '../repositories/chatMessage.repository.js';
import liveSessionService from '../services/liveSession.service.js';
import { AppError } from '../utils/AppError.js';

const PREFIJO_TOKEN = 'Bearer ';

/**
 * Middleware de autenticación para Socket.io.
 * Lee el token desde handshake.auth.token o header Authorization.
 */
function verificarTokenSocket(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization?.startsWith(PREFIJO_TOKEN)
      ? socket.handshake.headers.authorization.slice(PREFIJO_TOKEN.length)
      : null);

  if (!token) {
    return next(new Error('Token no proporcionado'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.usuario = payload; // { id, rol, email, iat, exp }
    next();
  } catch {
    next(new Error('Token inválido o expirado'));
  }
}

/**
 * Configura Socket.io para reuniones en vivo.
 * Eventos:
 *  - sala:unirse { liveSessionId }
 *  - sala:mensaje { liveSessionId, contenido }
 *  - sala:escribiendo { liveSessionId, escribiendo }
 *  - sala:abandonar { liveSessionId }
 * Broadcasts:
 *  - sala:usuario_unido, sala:usuario_salio, sala:mensaje_nuevo, sala:escribiendo, mentor_desconectado, bot_activado
 */
export function configurarSockets(io) {
  io.use(verificarTokenSocket);

  io.on('connection', (socket) => {
    const usuario = socket.usuario;
    socket.data.sesiones = new Set();

    // Log con pino si está disponible
    const log = (msg, extra) => {
      if (socket.request?.log) socket.request.log.info({ usuario: usuario.id, ...extra }, msg);
    };
    log('🔌 Socket conectado', { socketId: socket.id, rol: usuario.rol });

    // --- Unirse a una sala de sesión ---
    socket.on('sala:unirse', async ({ liveSessionId } = {}, callback) => {
      try {
        if (!liveSessionId || !mongoose.Types.ObjectId.isValid(liveSessionId)) {
          throw new AppError('ID de sesión inválido', 400, 'BAD_REQUEST');
        }

        const sesion = await liveSessionService.obtenerPorId(liveSessionId);

        // Verificar acceso al curso (mentor dueño / aprendiz inscrito / admin)
        // Para MVP, cualquier autenticado puede unirse si la sesión existe y no está cancelada
        if (sesion.estado === 'cancelada') {
          throw new AppError('La sesión está cancelada', 403, 'FORBIDDEN');
        }

        const room = `sesion:${liveSessionId}`;
        await socket.join(room);
        socket.data.sesiones.add(liveSessionId);

        // Persistir como asistente
        await liveSessionService.unirse(liveSessionId, usuario.id).catch(() => {});

        socket.to(room).emit('sala:usuario_unido', {
          liveSessionId,
          usuario: { id: usuario.id, rol: usuario.rol, email: usuario.email },
          timestamp: new Date().toISOString(),
        });

        if (callback) callback({ success: true, message: 'Unido a la sala', data: { liveSessionId, room } });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message, code: error.code || 'ERROR' });
        else socket.emit('error', { message: error.message });
      }
    });

    // --- Enviar mensaje en la sala ---
    socket.on('sala:mensaje', async ({ liveSessionId, contenido } = {}, callback) => {
      try {
        if (!liveSessionId || !mongoose.Types.ObjectId.isValid(liveSessionId)) {
          throw new AppError('ID de sesión inválido', 400, 'BAD_REQUEST');
        }
        const texto = (contenido || '').trim();
        if (!texto || texto.length > 2000) {
          throw new AppError('El mensaje debe tener entre 1 y 2000 caracteres', 400, 'BAD_REQUEST');
        }

        const room = `sesion:${liveSessionId}`;
        // El socket debe estar en la sala
        if (!socket.rooms.has(room)) {
          throw new AppError('Debes unirte a la sala antes de enviar mensajes', 403, 'FORBIDDEN');
        }

        const sesion = await liveSessionService.obtenerPorId(liveSessionId);

        const mensaje = await chatMessageRepository.crear({
          courseId: sesion.courseId._id || sesion.courseId,
          liveSessionId,
          remitenteId: usuario.id,
          rolRemitente: usuario.rol === 'administrador' ? 'mentor' : usuario.rol, // mapea admin → mentor para chat
          contenido: texto,
          esRespuestaBot: false,
        });

        const payload = {
          _id: mensaje._id,
          liveSessionId,
          courseId: mensaje.courseId,
          remitenteId: usuario.id,
          rolRemitente: mensaje.rolRemitente,
          contenido: texto,
          createdAt: mensaje.createdAt,
          email: usuario.email,
        };

        io.to(room).emit('sala:mensaje_nuevo', payload);

        if (callback) callback({ success: true, message: 'Mensaje enviado', data: payload });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message, code: error.code || 'ERROR' });
        else socket.emit('error', { message: error.message });
      }
    });

    // --- Indicador de escritura ---
    socket.on('sala:escribiendo', ({ liveSessionId, escribiendo } = {}) => {
      if (!liveSessionId || !mongoose.Types.ObjectId.isValid(liveSessionId)) return;
      const room = `sesion:${liveSessionId}`;
      socket.to(room).emit('sala:escribiendo', {
        liveSessionId,
        usuario: { id: usuario.id, email: usuario.email },
        escribiendo: !!escribiendo,
      });
    });

    // --- Abandonar sala ---
    socket.on('sala:abandonar', async ({ liveSessionId } = {}, callback) => {
      const room = `sesion:${liveSessionId}`;
      await socket.leave(room);
      socket.data.sesiones.delete(liveSessionId);
      socket.to(room).emit('sala:usuario_salio', {
        liveSessionId,
        usuario: { id: usuario.id, rol: usuario.rol },
        timestamp: new Date().toISOString(),
      });
      if (callback) callback({ success: true });
    });

    // --- Evento: bot activado (cuando el mentor se desconecta y el bot toma el relevo) ---
    socket.on('bot_activado', ({ liveSessionId } = {}) => {
      if (!liveSessionId) return;
      const room = `sesion:${liveSessionId}`;
      io.to(room).emit('bot_activado', {
        liveSessionId,
        message: 'El mentor se ha desconectado. El asistente de IA está disponible para ayudarte.',
        timestamp: new Date().toISOString(),
      });
    });

    // --- Desconexión ---
    socket.on('disconnect', () => {
      log('🔌 Socket desconectado', { socketId: socket.id });

      // Notificar a cada sala donde estaba el usuario
      for (const liveSessionId of socket.data.sesiones) {
        const room = `sesion:${liveSessionId}`;
        // Si era mentor, notificar evento específico
        if (usuario.rol === 'mentor') {
          io.to(room).emit('mentor_desconectado', {
            liveSessionId,
            mentorId: usuario.id,
            timestamp: new Date().toISOString(),
          });
        }
        socket.to(room).emit('sala:usuario_salio', {
          liveSessionId,
          usuario: { id: usuario.id, rol: usuario.rol },
          timestamp: new Date().toISOString(),
        });
      }
    });
  });
}
