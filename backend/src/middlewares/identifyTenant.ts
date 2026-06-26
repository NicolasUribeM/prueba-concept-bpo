/**
 * Middleware: identifyTenant
 * -----------------------------------------------------------------------------
 * Intercepta TODA petición entrante y resuelve el contexto del tenant a partir
 * del header HTTP personalizado "X-Tenant-ID" (que contiene el slug, ej:
 * "tenant-a").
 *
 * Responsabilidades:
 *   1. Verificar que el header venga en la petición.
 *   2. Validar contra la base de datos que el tenant exista realmente.
 *   3. Adjuntar el tenant resuelto a req.tenant para los siguientes middlewares
 *      y controladores.
 *
 * Importante: la fuente de verdad del tenant es SIEMPRE la base de datos, nunca
 * un valor de confianza enviado por el cliente.
 */
import { Request, Response, NextFunction } from 'express';
import { tenantService } from '../services/tenant.service';

export async function identifyTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // El header llega siempre en minúsculas en Express.
    const slug = req.header('X-Tenant-ID');

    if (!slug) {
      res.status(400).json({
        error: 'Falta el header X-Tenant-ID que identifica al tenant.',
      });
      return;
    }

    // Validamos que el tenant exista en la base de datos.
    const tenant = await tenantService.buscarPorSlug(slug);

    if (!tenant) {
      res.status(404).json({
        error: `El tenant '${slug}' no existe.`,
      });
      return;
    }

    // Inyectamos el contexto del tenant para el resto del pipeline.
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}
