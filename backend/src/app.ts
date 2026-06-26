/**
 * Configuración de la aplicación Express.
 * Aquí se registran middlewares globales, rutas y el manejador de errores.
 * Separar 'app' de 'server' facilita las pruebas y la lectura.
 */
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// --- Middlewares globales ---
app.use(cors()); // permite peticiones desde el frontend (Vite en :5173)
app.use(express.json()); // parsea el body JSON de las peticiones

// --- Healthcheck: comprobación rápida de que el servidor responde ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-multitenant' });
});

// --- Rutas de la API versionada ---
app.use('/api/v1', apiRoutes);

// --- Ruta no encontrada ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' });
});

// --- Manejador de errores (siempre al final) ---
app.use(errorHandler);

export default app;
