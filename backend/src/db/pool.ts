/**
 * Pool de conexiones a MySQL usando el driver mysql2 (API de promesas).
 *
 * Usar un pool en lugar de conexiones sueltas permite reutilizar conexiones
 * y manejar concurrencia sin abrir/cerrar en cada consulta. Todas las consultas
 * del proyecto pasan por aquí.
 */
import mysql from 'mysql2/promise';
import { env } from '../config/env';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  charset: 'utf8mb4', // soporte completo de acentos y caracteres especiales
  waitForConnections: true,
  connectionLimit: 10, // máximo de conexiones simultáneas en el pool
  queueLimit: 0,
});

/**
 * Comprueba que la base de datos responde. Se llama al arrancar el servidor
 * para fallar rápido si MySQL no está disponible.
 */
export async function verificarConexion(): Promise<void> {
  const conexion = await pool.getConnection();
  await conexion.ping();
  conexion.release();
}
