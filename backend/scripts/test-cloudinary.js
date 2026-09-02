
import 'dotenv/config';
import cloudinary from '../src/config/cloudinary.js';

cloudinary.api.ping()
  .then((res) => console.log('✅ Cloudinary conectado:', res))
  .catch((err) => console.error('❌ Error de conexión:', err.message));