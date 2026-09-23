import Groq from 'groq-sdk';
import cursoRepository from '../repositories/course.repository.js';
import { AppError } from '../utils/AppError.js';
import { uploadImageCloudinary } from '../config/cloudinary.img.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class CursoService {
  async crearCurso(mentor, datosCurso) {
    // 👇 mentor ahora es { id, nombre }, y se arma el subdocumento
    //    tal como lo exige el esquema (mentor._id es required)
    return cursoRepository.crear({
      ...datosCurso,
      mentor: { _id: mentor.id, nombre: mentor.nombre },
    });
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

  async listarTodos() {
    return cursoRepository.listarTodos();
  }

  async actualizarCurso(id, mentorId, cambios, rol) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId, rol);
    return cursoRepository.actualizar(id, cambios);
  }

  async subirImagenCurso(id, mentorId, filePath) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId);

    const imagenData = await uploadImageCloudinary(filePath);
    // 👇 portadaUrl en el esquema es un String, así que guardamos solo la url
    return cursoRepository.actualizarImagen(id, imagenData.url);
  }

  async cambiarEstado(id, mentorId, estado, rol) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId, rol);
    return cursoRepository.actualizar(id, { estado });
  }

  async eliminarCurso(id, mentorId, rol) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId, rol);
    return cursoRepository.eliminarLogico(id);
  }

  async generarEstructuraCurso(id, mentorId, rol) {
    const curso = await this.obtenerCursoPorId(id);
    this.verificarPropiedad(curso, mentorId, rol);

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
  // El administrador tiene bypass total sobre cualquier curso.
  verificarPropiedad(curso, mentorId, rol) {
    if (rol === 'administrador') return;
    const idDelMentor = curso.mentor._id ? curso.mentor._id.toString() : curso.mentor.toString();
    if (idDelMentor !== mentorId.toString()) {
      throw new AppError('No tienes permiso sobre este curso', 403);
    }
  }
}

export default new CursoService();