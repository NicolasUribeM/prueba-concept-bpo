/**
 * Controlador de Records.
 * Lee el tenant SIEMPRE desde req.tenant (resuelto por el servidor), nunca del
 * body ni de query params manipulables por el cliente.
 */
import { Request, Response, NextFunction } from 'express';
import { recordService } from '../services/record.service';

export const recordController = {
  /**
   * GET /api/v1/records?search=&sortBy=&sortDir=&limit=&offset=
   * Devuelve los records del tenant autenticado con búsqueda, orden y paginación.
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Saneamos la paginación: valores por defecto y límites razonables.
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'id';
      const sortDir = typeof req.query.sortDir === 'string' ? req.query.sortDir : 'asc';

      const resultado = await recordService.listarPorTenant(req.tenant!.id, {
        search,
        sortBy,
        sortDir,
        limit,
        offset,
      });

      res.json(resultado);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/records/stats
   * Métricas agregadas del tenant autenticado (total, por estado, monto).
   */
  async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await recordService.estadisticasPorTenant(req.tenant!.id);
      res.json(stats);
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

      const nuevo = await recordService.crear(req.tenant!, {
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
