/**
 * Rutas de Autenticación bajo /api/v1/login.
 * El login requiere identifyTenant porque el usuario se valida dentro de su
 * tenant (el slug llega en el header X-Tenant-ID).
 */
import { Router } from 'express';
import { identifyTenant } from '../middlewares/identifyTenant';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/login', identifyTenant, authController.login);

export default router;
