/**
 * Middleware global de manejo de errores.
 * Centraliza el formato de respuesta de error (filosofía DRY) y evita filtrar
 * detalles internos al cliente. Express lo reconoce por tener 4 argumentos.
 */
import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno del servidor.' });
}
