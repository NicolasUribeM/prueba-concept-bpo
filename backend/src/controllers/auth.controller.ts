/**
 * Controlador de Autenticación.
 * Orquesta la petición HTTP de login: valida entrada, llama al servicio y
 * responde. El tenant ya viene resuelto en req.tenant (identifyTenant).
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body ?? {};

      if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
        return;
      }

      // req.tenant siempre existe aquí porque la ruta usa identifyTenant.
      const resultado = await authService.login(req.tenant!.id, email, password);

      if (!resultado) {
        res.status(401).json({ error: 'Credenciales inválidas.' });
        return;
      }

      res.json({
        token: resultado.token,
        usuario: resultado.usuario,
        tenant: { slug: req.tenant!.slug, name: req.tenant!.name },
      });
    } catch (error) {
      next(error);
    }
  },
};
