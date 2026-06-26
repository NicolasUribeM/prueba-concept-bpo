/**
 * ProtectedRoute — Guardián de rutas (Route Guard).
 * -----------------------------------------------------------------------------
 * Protege las rutas privadas con doble verificación:
 *   1. Que exista una sesión autenticada.
 *   2. Que el tenant de la URL (/:tenant/...) coincida con el tenant de la
 *      sesión. Así, cambiar la URL a mano hacia otro tenant NO da acceso.
 *
 * Nota: esto es seguridad de UX. La seguridad REAL la impone el backend
 * (el token está atado a su tenant); aquí solo evitamos render inválido.
 */
import { Navigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import type { JSX } from 'react';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, tenantSlug } = useAppSelector((s) => s.auth);
  const { tenant } = useParams();

  // Sin sesión -> al login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Sesión de otro tenant distinto al de la URL -> bloqueado.
  if (tenant !== tenantSlug) {
    return <Navigate to={`/${tenantSlug}/dashboard`} replace />;
  }

  return children;
}
