/**
 * Tests de aislamiento multi-tenant (integración con supertest).
 * -----------------------------------------------------------------------------
 * Verifican EL criterio central de la prueba: la imposibilidad de acceder o
 * modificar datos de otro tenant manipulando el cliente. Requiere la base de
 * datos levantada (docker compose up -d).
 *
 * Ejecutar:  npm test
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { pool } from '../db/pool';

const PASSWORD = 'password123';

/** Helper: inicia sesión en un tenant y devuelve la respuesta. */
function login(tenant: string, email: string, password = PASSWORD) {
  return request(app)
    .post('/api/v1/login')
    .set('X-Tenant-ID', tenant)
    .send({ email, password });
}

let tokenAdminA = '';
let tokenUserA = '';

beforeAll(async () => {
  tokenAdminA = (await login('tenant-a', 'admin@alfa.com')).body.token;
  tokenUserA = (await login('tenant-a', 'user@alfa.com')).body.token;
});

afterAll(async () => {
  await pool.end(); // cierra el pool para que el proceso de test termine
});

describe('Autenticación', () => {
  it('login válido devuelve un token JWT', async () => {
    const res = await login('tenant-a', 'admin@alfa.com');
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.usuario.role).toBe('ADMIN');
  });

  it('credenciales inválidas devuelven 401', async () => {
    const res = await login('tenant-a', 'admin@alfa.com', 'clave-mala');
    expect(res.status).toBe(401);
  });

  it('tenant inexistente devuelve 404', async () => {
    const res = await login('tenant-x', 'admin@alfa.com');
    expect(res.status).toBe(404);
  });
});

describe('Aislamiento entre tenants (lo central de la prueba)', () => {
  it('GET /records del propio tenant devuelve solo sus datos', async () => {
    const res = await request(app)
      .get('/api/v1/records?limit=5')
      .set('X-Tenant-ID', 'tenant-a')
      .set('Authorization', `Bearer ${tokenAdminA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: any) => r.tenant_id === 1)).toBe(true);
  });

  it('token de tenant-a contra header tenant-b devuelve 403', async () => {
    const res = await request(app)
      .get('/api/v1/records')
      .set('X-Tenant-ID', 'tenant-b')
      .set('Authorization', `Bearer ${tokenAdminA}`);
    expect(res.status).toBe(403);
  });

  it('petición sin token devuelve 401', async () => {
    const res = await request(app)
      .get('/api/v1/records')
      .set('X-Tenant-ID', 'tenant-a');
    expect(res.status).toBe(401);
  });

  it('petición sin header X-Tenant-ID devuelve 400', async () => {
    const res = await request(app).get('/api/v1/records');
    expect(res.status).toBe(400);
  });
});

describe('Control por roles', () => {
  it('un USER no puede crear registros (403)', async () => {
    const res = await request(app)
      .post('/api/v1/records')
      .set('X-Tenant-ID', 'tenant-a')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ title: 'Intento de USER' });
    expect(res.status).toBe(403);
  });

  it('un ADMIN crea un registro atado a SU tenant, ignorando tenant_id del body', async () => {
    const res = await request(app)
      .post('/api/v1/records')
      .set('X-Tenant-ID', 'tenant-a')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .send({ title: 'Registro de prueba (test)', tenant_id: 2, amount: 100 });
    expect(res.status).toBe(201);
    // El tenant_id NUNCA se toma del body: debe quedar en 1 (tenant-a).
    expect(res.body.tenant_id).toBe(1);
  });
});
