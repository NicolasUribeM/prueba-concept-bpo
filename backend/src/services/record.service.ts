/**
 * Servicio de Records: acceso a datos de la tabla 'records'.
 *
 * REGLA DE ORO DEL AISLAMIENTO: todas las consultas reciben el tenantId
 * resuelto por el servidor (nunca el cliente) y filtran/insertan SIEMPRE
 * por ese tenant_id. Es imposible leer o escribir datos de otro tenant.
 */
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool';
import { Tenant } from '../types';

export interface Record {
  id: number;
  tenant_id: number;
  reference: string;
  title: string;
  description: string | null;
  status: 'ACTIVO' | 'PENDIENTE' | 'ARCHIVADO';
  amount: number;
  created_at: string;
}

export interface OpcionesListado {
  search: string;
  sortBy: string;
  sortDir: string;
  limit: number;
  offset: number;
}

export interface ResultadoPaginado {
  data: Record[];
  pagination: { total: number; limit: number; offset: number };
}

// Listas blancas para construir el ORDER BY de forma segura (no se puede
// parametrizar el nombre de columna, así que lo restringimos a estos valores).
const COLUMNAS_ORDEN: { [clave: string]: string } = {
  id: 'id',
  reference: 'reference',
  title: 'title',
  status: 'status',
  amount: 'amount',
  created_at: 'created_at',
};

export const recordService = {
  /**
   * Lista los records de UN tenant con búsqueda, orden y paginación.
   * Todo filtrado por tenant_id -> aislamiento garantizado.
   */
  async listarPorTenant(
    tenantId: number,
    opciones: OpcionesListado
  ): Promise<ResultadoPaginado> {
    // Orden seguro (whitelist). Por defecto: id ascendente.
    const columna = COLUMNAS_ORDEN[opciones.sortBy] ?? 'id';
    const direccion = opciones.sortDir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Filtro de búsqueda opcional (título, estado o referencia).
    const condiciones: string[] = ['tenant_id = ?'];
    const params: (string | number)[] = [tenantId];
    if (opciones.search) {
      condiciones.push('(title LIKE ? OR status LIKE ? OR reference LIKE ?)');
      const like = `%${opciones.search}%`;
      params.push(like, like, like);
    }
    const where = `WHERE ${condiciones.join(' AND ')}`;

    // Total (respeta el filtro de búsqueda) para los metadatos de paginación.
    const [totalFilas] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM records ${where}`,
      params
    );
    const total = Number(totalFilas[0].total);

    // Página solicitada.
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT id, tenant_id, reference, title, description, status, amount, created_at
       FROM records
       ${where}
       ORDER BY ${columna} ${direccion}
       LIMIT ? OFFSET ?`,
      [...params, opciones.limit, opciones.offset]
    );

    return {
      data: filas as Record[],
      pagination: { total, limit: opciones.limit, offset: opciones.offset },
    };
  },

  /**
   * Estadísticas agregadas del tenant: total, monto, conteo por estado y
   * tendencia diaria en el rango de días indicado (30/60/120).
   * Alimenta métricas y gráficos.
   */
  async estadisticasPorTenant(
    tenantId: number,
    dias = 30
  ): Promise<{
    total: number;
    montoTotal: number;
    porEstado: { ACTIVO: number; PENDIENTE: number; ARCHIVADO: number };
    montoPorEstado: { ACTIVO: number; PENDIENTE: number; ARCHIVADO: number };
    tendencia: { fecha: string; total: number }[];
  }> {
    const [resumen] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*)                                  AS total,
         COALESCE(SUM(amount), 0)                  AS montoTotal,
         SUM(status = 'ACTIVO')                    AS activos,
         SUM(status = 'PENDIENTE')                 AS pendientes,
         SUM(status = 'ARCHIVADO')                 AS archivados,
         COALESCE(SUM(IF(status='ACTIVO', amount, 0)), 0)    AS montoActivo,
         COALESCE(SUM(IF(status='PENDIENTE', amount, 0)), 0) AS montoPendiente,
         COALESCE(SUM(IF(status='ARCHIVADO', amount, 0)), 0) AS montoArchivado
       FROM records
       WHERE tenant_id = ?`,
      [tenantId]
    );

    // Saneamos el rango a los valores permitidos.
    const rango = [30, 60, 120].includes(dias) ? dias : 30;
    // DATE_FORMAT devuelve un string 'YYYY-MM-DD' (mysql2 entrega DATE como
    // objeto Date; forzamos string para que el frontend lo formatee bien).
    const [tendenciaFilas] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS fecha, COUNT(*) AS total
       FROM records
       WHERE tenant_id = ? AND created_at >= (CURDATE() - INTERVAL ? DAY)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY fecha ASC`,
      [tenantId, rango - 1]
    );

    const f = resumen[0];
    return {
      total: Number(f.total),
      montoTotal: Number(f.montoTotal),
      porEstado: {
        ACTIVO: Number(f.activos),
        PENDIENTE: Number(f.pendientes),
        ARCHIVADO: Number(f.archivados),
      },
      montoPorEstado: {
        ACTIVO: Number(f.montoActivo),
        PENDIENTE: Number(f.montoPendiente),
        ARCHIVADO: Number(f.montoArchivado),
      },
      tendencia: tendenciaFilas.map((t) => ({
        fecha: String(t.fecha).slice(0, 10),
        total: Number(t.total),
      })),
    };
  },

  /**
   * Inserta un nuevo record vinculándolo OBLIGATORIAMENTE al tenant del
   * servidor. Genera una 'reference' consecutiva al total existente del tenant
   * (ej: si hay 500 registros, el nuevo será REC-A-000501).
   */
  async crear(
    tenant: Tenant,
    datos: { title: string; description?: string; status?: string; amount?: number }
  ): Promise<Record> {
    // Secuencia consecutiva basada en la cantidad de registros del tenant.
    const [cnt] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM records WHERE tenant_id = ?',
      [tenant.id]
    );
    const secuencia = Number(cnt[0].c) + 1;
    const letra = tenant.slug.replace('tenant-', '').toUpperCase();
    const reference = `REC-${letra}-${String(secuencia).padStart(6, '0')}`;

    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO records (tenant_id, reference, title, description, status, amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tenant.id,
        reference,
        datos.title,
        datos.description ?? null,
        datos.status ?? 'ACTIVO',
        datos.amount ?? 0,
      ]
    );

    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT id, tenant_id, reference, title, description, status, amount, created_at
       FROM records WHERE id = ? AND tenant_id = ?`,
      [resultado.insertId, tenant.id]
    );

    return filas[0] as Record;
  },
};
