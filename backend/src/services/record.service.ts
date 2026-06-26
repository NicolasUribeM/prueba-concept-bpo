/**
 * Servicio de Records: acceso a datos de la tabla 'records'.
 *
 * REGLA DE ORO DEL AISLAMIENTO: todas las consultas reciben el tenantId
 * resuelto por el servidor (nunca el cliente) y filtran/insertan SIEMPRE
 * por ese tenant_id. Es imposible leer o escribir datos de otro tenant.
 */
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool';

export interface Record {
  id: number;
  tenant_id: number;
  title: string;
  description: string | null;
  status: 'ACTIVO' | 'PENDIENTE' | 'ARCHIVADO';
  amount: number;
  created_at: string;
}

export interface ResultadoPaginado {
  data: Record[];
  pagination: { total: number; limit: number; offset: number };
}

export const recordService = {
  /**
   * Lista los records de UN tenant con paginación (limit / offset).
   * Devuelve también el total para que el frontend pueda paginar.
   */
  async listarPorTenant(
    tenantId: number,
    limit: number,
    offset: number
  ): Promise<ResultadoPaginado> {
    // Total de registros del tenant (para metadatos de paginación).
    const [totalFilas] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM records WHERE tenant_id = ?',
      [tenantId]
    );
    const total = Number(totalFilas[0].total);

    // Página solicitada. Filtramos por tenant_id -> aislamiento garantizado.
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT id, tenant_id, title, description, status, amount, created_at
       FROM records
       WHERE tenant_id = ?
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [tenantId, limit, offset]
    );

    return {
      data: filas as Record[],
      pagination: { total, limit, offset },
    };
  },

  /**
   * Inserta un nuevo record vinculándolo OBLIGATORIAMENTE al tenant del
   * servidor. El tenant_id jamás se toma del body de la petición.
   */
  async crear(
    tenantId: number,
    datos: { title: string; description?: string; status?: string; amount?: number }
  ): Promise<Record> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO records (tenant_id, title, description, status, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [
        tenantId,
        datos.title,
        datos.description ?? null,
        datos.status ?? 'ACTIVO',
        datos.amount ?? 0,
      ]
    );

    // Devolvemos el registro recién creado (también filtrado por tenant).
    const [filas] = await pool.query<RowDataPacket[]>(
      'SELECT id, tenant_id, title, description, status, amount, created_at FROM records WHERE id = ? AND tenant_id = ?',
      [resultado.insertId, tenantId]
    );

    return filas[0] as Record;
  },
};
