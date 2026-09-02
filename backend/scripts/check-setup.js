// Verifica que las variables de entorno mínimas existan antes de levantar el server.
// Uso: npm run check-setup
import 'dotenv/config';

const requeridas = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
const faltantes = requeridas.filter((v) => !process.env[v]);

if (faltantes.length) {
  console.error('❌ Faltan variables de entorno:', faltantes.join(', '));
  process.exit(1);
}

console.log('✅ Configuración de entorno OK');
