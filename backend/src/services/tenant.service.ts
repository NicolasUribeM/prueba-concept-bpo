/**
 * Servicio de Tenants: acceso a datos de la tabla 'tenants'.
 * Aísla el SQL del resto de la aplicación (separación de responsabilidades).
 */
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { Tenant } from '../types';

export const tenantService = {
  /**
   * Busca un tenant por su slug (el valor del header X-Tenant-ID).
   * Devuelve null si no existe. Consulta parametrizada para evitar inyección SQL.
   */
  async buscarPorSlug(slug: string): Promise<Tenant | null> {
    const [filas] = await pool.query<RowDataPacket[]>(
      'SELECT id, slug, name FROM tenants WHERE slug = ? LIMIT 1',
      [slug]
    );
    if (filas.length === 0) return null;
    return filas[0] as Tenant;
  },
};
