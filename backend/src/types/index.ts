/**
 * Tipos compartidos del backend.
 *
 * Incluye la extensión de la interfaz Request de Express para adjuntar el
 * contexto de tenant y de usuario que resuelven los middlewares de seguridad.
 * Gracias a esto, los controladores acceden a req.tenant / req.user de forma
 * tipada y segura.
 */

/** Roles soportados por el sistema. */
export type Rol = 'ADMIN' | 'USER';

/** Representa un inquilino (empresa) del sistema multi-tenant. */
export interface Tenant {
  id: number;
  slug: string;
  name: string;
}

/** Datos del usuario autenticado que viajan dentro del JWT. */
export interface UsuarioAutenticado {
  userId: number;
  tenantId: number;
  email: string;
  role: Rol;
}

/**
 * Extensión global del tipo Request de Express.
 * - req.tenant lo inyecta el middleware identifyTenant.
 * - req.user   lo inyecta el middleware checkAuth.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: Tenant;
      user?: UsuarioAutenticado;
    }
  }
}
