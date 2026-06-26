/**
 * Enrutador principal de la API v1. Agrupa todos los recursos bajo /api/v1.
 */
import { Router } from 'express';
import authRoutes from './auth.routes';
import recordRoutes from './record.routes';

const router = Router();

router.use('/', authRoutes); // POST /api/v1/login
router.use('/records', recordRoutes); // GET y POST /api/v1/records

export default router;
