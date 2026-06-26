/**
 * Rutas de Records bajo /api/v1/records.
 *
 * Cadena de seguridad (filosofía DRY: se declara una sola vez por ruta):
 *   identifyTenant -> checkAuth -> [requireRole] -> controlador
 *
 *   GET  /records  -> ADMIN y USER pueden leer.
 *   POST /records  -> solo ADMIN puede crear (control por roles).
 */
import { Router } from 'express';
import { identifyTenant } from '../middlewares/identifyTenant';
import { checkAuth, requireRole } from '../middlewares/checkAuth';
import { recordController } from '../controllers/record.controller';

const router = Router();

router.get('/', identifyTenant, checkAuth, recordController.listar);

// Estadísticas del tenant (alimenta las tarjetas de métricas del dashboard).
router.get('/stats', identifyTenant, checkAuth, recordController.estadisticas);

router.post(
  '/',
  identifyTenant,
  checkAuth,
  requireRole('ADMIN'),
  recordController.crear
);

export default router;
