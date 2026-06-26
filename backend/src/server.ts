/**
 * Punto de entrada del backend.
 * Verifica la conexión a la base de datos y arranca el servidor HTTP.
 */
import app from './app';
import { env } from './config/env';
import { verificarConexion } from './db/pool';

async function iniciar(): Promise<void> {
  try {
    // Fallamos rápido si MySQL no está disponible.
    await verificarConexion();
    console.log('✓ Conexión a MySQL establecida correctamente.');

    app.listen(env.port, () => {
      console.log(`✓ Servidor escuchando en http://localhost:${env.port}`);
      console.log(`  Healthcheck: http://localhost:${env.port}/health`);
    });
  } catch (error) {
    console.error('✗ No se pudo iniciar el servidor:', (error as Error).message);
    console.error('  ¿Está MySQL levantado? Ejecuta: docker compose up -d');
    process.exit(1);
  }
}

iniciar();
