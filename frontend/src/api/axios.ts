/**
 * Instancia personalizada de axios + interceptores.
 * -----------------------------------------------------------------------------
 * Centraliza TODA la comunicación con el backend (filosofía DRY).
 *
 * Request Interceptor: inyecta automáticamente en cada petición:
 *   - X-Tenant-ID  (slug del tenant activo, leído del store)
 *   - Authorization: Bearer <token>  (si hay sesión)
 * Así ningún componente tiene que recordar enviar estas cabeceras.
 *
 * Para evitar dependencia circular (store -> axios -> store), el store se
 * inyecta una sola vez desde main.tsx mediante setStoreRef.
 */
import axios from 'axios';

// Referencia perezosa al store para leer token y tenant sin importarlo directo.
let getStoreState: (() => any) | null = null;
export function setStoreRef(getState: () => any) {
  getStoreState = getState;
}

export const api = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
});

// --- Request Interceptor ---
api.interceptors.request.use((config) => {
  const state = getStoreState?.();
  const auth = state?.auth;

  if (auth?.tenantSlug) {
    config.headers['X-Tenant-ID'] = auth.tenantSlug;
  }
  if (auth?.token) {
    config.headers['Authorization'] = `Bearer ${auth.token}`;
  }
  return config;
});

// --- Response Interceptor: manejo centralizado de errores de sesión ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Aquí podríamos despachar un logout automático ante un 401, por ejemplo.
    return Promise.reject(error);
  }
);
