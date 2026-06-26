/**
 * Middleware: checkAuth (y requireRole)
 * -----------------------------------------------------------------------------
 * Verifica la autenticación mediante JWT y, sobre todo, garantiza el AISLAMIENTO
 * entre tenants a nivel de servidor.
 *
 * Flujo:
 *   1. Lee el token del header "Authorization: Bearer <token>".
 *   2. Verifica la firma del JWT con el secreto del servidor.
 *   3. CLAVE DE SEGURIDAD: comprueba que el tenant del token coincida con el
 *      tenant resuelto por identifyTenant. Así, aunque un atacante cambie el
 *      header X-Tenant-ID, su token seguirá atado a SU tenant -> 403.
 *   4. Adjunta el usuario autenticado a req.user.
 *
 * Debe ejecutarse SIEMPRE después de identifyTenant.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Rol, UsuarioAutenticado } from '../types';

export function checkAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Defensa en profundidad: si por error no se ejecutó identifyTenant, abortamos.
  if (!req.tenant) {
    res.status(500).json({
      error: 'Contexto de tenant no resuelto. identifyTenant debe ir primero.',
    });
    return;
  }

  const header = req.header('Authorization');

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación ausente o mal formado.' });
    return;
  }

  const token = header.substring('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret) as UsuarioAutenticado;

    // ----- AISLAMIENTO MULTI-TENANT (lo que evalúa la prueba) -----
    // El usuario solo puede operar sobre el tenant al que pertenece su token.
    if (payload.tenantId !== req.tenant.id) {
      res.status(403).json({
        error: 'Acceso denegado: el token no pertenece al tenant solicitado.',
      });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware de fábrica para exigir uno o más roles.
 * Uso: router.post('/records', checkAuth, requireRole('ADMIN'), controlador)
 */
export function requireRole(...rolesPermitidos: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }
    if (!rolesPermitidos.includes(req.user.role)) {
      res.status(403).json({
        error: `Acceso denegado: se requiere rol ${rolesPermitidos.join(' o ')}.`,
      });
      return;
    }
    next();
  };
}
