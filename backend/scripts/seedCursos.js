import 'dotenv/config'; // 👈 carga el .env
import mongoose from "mongoose";
import Curso from "../src/models/course.model.js"; // asegúrate de que la ruta tenga .js

console.log("URI:", process.env.MONGODB_URI); // 👈 prueba para verificar que la variable existe

await mongoose.connect(process.env.MONGODB_URI);

const tecnologias = [
  'JavaScript', 'Python', 'Java', 'C#', 'PHP',
  'Go', 'Rust', 'TypeScript', 'Node.js', 'Angular',
  'React', 'Vue.js', 'Django', 'Spring Boot', 'Laravel'
];

const niveles = ['Principiante', 'Intermedio', 'Avanzado'];

function generarCurso(i) {
  const tecnologia = tecnologias[Math.floor(Math.random() * tecnologias.length)];
  const nivel = niveles[Math.floor(Math.random() * niveles.length)];
  return {
    titulo: `Curso ${i + 1}: ${tecnologia} - ${nivel}`,
    descripcion: `Aprende ${tecnologia} en nivel ${nivel} con proyectos prácticos. Este curso número ${i + 1} está diseñado para desarrolladores que quieren mejorar sus habilidades.`,
    categoria: "Programación",
    mentor: new mongoose.Types.ObjectId(),
    estado: "publicado",
    precio: Math.floor(Math.random() * 200) + 50,
    duracionEstimadaHoras: Math.floor(Math.random() * 40) + 10,
    activo: true,
  };
}

const cursos = Array.from({ length: 100 }, (_, i) => generarCurso(i));

await Curso.deleteMany({});
await Curso.insertMany(cursos);

console.log('✅ Se han insertado 100 cursos de programación en la base de datos.');

await mongoose.disconnect();
