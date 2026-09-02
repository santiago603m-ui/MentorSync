import Document from '../models/document.model.js';

class DocumentRepository {
  async crear(datosDocumento) {
    return Document.create(datosDocumento);
  }

  async buscarPorId(id) {
    return Document.findById(id).populate('courseId', 'titulo');
  }

  async listarPorCurso(courseId) {
    return Document.find({ courseId }).sort({ createdAt: -1 });
  }

  async actualizarEstado(id, { estado, errorMessage = null, fileUrl } = {}) {
    const cambios = { estado };
    if (errorMessage !== null) cambios.errorMessage = errorMessage;
    if (fileUrl) cambios.fileUrl = fileUrl;
    return Document.findByIdAndUpdate(id, cambios, { new: true, runValidators: true });
  }
}

export default new DocumentRepository();