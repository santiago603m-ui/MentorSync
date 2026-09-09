import Groq from 'groq-sdk';
import cursoRepository from '../repositories/course.repository.js';
import { AppError } from '../utils/AppError.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class CursoService {
  async crearCurso(mentorId, datosCurso) {
    return cursoRepository.crear({ ...datosCurso, mentor: mentorId });
  }

  async obtenerCursoPorId(id) {
    const curso = await cursoRepository.buscarPorId(id);
    if (!curso) {
      throw new AppError('Curso no encontrado', 404);
    }
    return curso;
  }

  async listarCursosPublicados(opcionesPaginacion) {
    return cursoRepository.listarPublicados(opcionesPaginacion);
  }
  async inscribirAprendiz(cursoId, aprendiz) {
    const curso = await cursoRepository.buscarPorId(cursoId);
    if (!curso) return null;

    // 👇 Validar si ya está inscrito
    const yaInscrito = curso.inscritos.some(i => i.id.toString() === aprendiz.id.toString());
    if (yaInscrito) return curso; // no lo vuelve a inscribir

    return cursoRepository.inscribirAprendiz(cursoId, aprendiz);
  }

  async cancelarInscripcion(cursoId, inscritoId) {
    return cursoRepository.cancelarInscripcion(cursoId, inscritoId);
  }


  async listarCursosDeMentor(mentorId) {
    return cursoRepository.listarPorMentor(mentorId);
  }

  async actualizarCurso(id, mentorId, cambios) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);
    return cursoRepository.actualizar(id, cambios);
  }

  async cambiarEstado(id, mentorId, estado) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);
    return cursoRepository.actualizar(id, { estado });
  }

  async eliminarCurso(id, mentorId) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);
    return cursoRepository.eliminarLogico(id);
  }

  async generarEstructuraCurso(id, mentorId) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);

    if (!curso.contenidoTextoPlano) {
      throw new AppError('El curso no tiene un PDF procesado previamente', 400);
    }

    const prompt = `
    Analiza el siguiente texto de un manual de curso y divídelo en una estructura de aprendizaje profesional estilo plataforma de cursos online (con módulos y lecciones detalladas).
    
    Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido, sin texto adicional antes ni después, siguiendo estrictamente esta estructura de esquema:
    {
      "modulos": [
        {
          "titulo": "Título del Módulo 1",
          "descripcion": "Breve descripción del módulo",
          "orden": 1,
          "lecciones": [
            {
              "titulo": "Título de la Lección 1",
              "contenido": "Explicación detallada, clara y didáctica de este tema basada en el texto...",
              "puntosClave": ["Punto clave 1", "Punto clave 2"],
              "orden": 1
            }
          ]
        }
      ]
    }

    Aquí está el contenido del curso:
    ${curso.contenidoTextoPlano.substring(0, 25000)}
    `;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const resultadoAI = JSON.parse(completion.choices[0].message.content);

    const cambios = {
      modulos: resultadoAI.modulos,
      bot: {
        ...(curso.bot || {}),
        entrenado: true,
        fechaEntrenamiento: new Date(),
      },
    };

    return cursoRepository.actualizar(id, cambios);
  }

  // Un mentor solo puede modificar sus propios cursos.
  // El rol "administrador" se maneja aparte, vía verificarRol en la ruta.
  verificarPropiedad(curso, mentorId) {
    const idDelMentor = curso.mentor._id ? curso.mentor._id.toString() : curso.mentor.toString();
    if (idDelMentor !== mentorId.toString()) {
      throw new AppError('No tienes permiso sobre este curso', 403);
    }
  }
}

export default new CursoService();