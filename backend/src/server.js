import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { conexionDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

// Middlewares globales
app.use(express.json());
app.use(cors());

// Conexión a Base de Datos
conexionDB();

// Rutas de la API
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});