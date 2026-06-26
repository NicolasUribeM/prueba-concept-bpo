/**
 * Controlador de Records.
 * Lee el tenant SIEMPRE desde req.tenant (resuelto por el servidor), nunca del
 * body ni de query params manipulables por el cliente.
 */
import { Request, Response, NextFunction } from 'express';
import { recordService } from '../services/record.service';

export const recordController = {
  /**
   * GET /api/v1/records?limit=&offset=
   * Devuelve los records del tenant autenticado, paginados.
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Saneamos la paginación: valores por defecto y límites razonables.
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const resultado = await recordService.listarPorTenant(
        req.tenant!.id,
        limit,
        offset
      );

      res.json(resultado);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/records
   * Crea un record vinculado al tenant autenticado.
   */
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, status, amount } = req.body ?? {};

      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'El campo "title" es obligatorio.' });
        return;
      }

      const nuevo = await recordService.crear(req.tenant!.id, {
        title,
        description,
        status,
        amount,
      });

      res.status(201).json(nuevo);
    } catch (error) {
      next(error);
    }
  },
};
