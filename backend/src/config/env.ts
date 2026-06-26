/**
 * Configuración centralizada de variables de entorno.
 * Carga el archivo .env y expone los valores tipados al resto de la app,
 * con valores por defecto sensatos para desarrollo local.
 */
import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'app_pass',
    database: process.env.DB_NAME || 'multitenant_db',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'secreto_inseguro_solo_dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
};
