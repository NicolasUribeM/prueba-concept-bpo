-- =============================================================================
--  init.sql — Migración + datos de prueba (data dummy) para la prueba Multi-Tenant
-- -----------------------------------------------------------------------------
--  Este script se ejecuta AUTOMÁTICAMENTE al crear el contenedor MySQL
--  (ver docker-compose.yml). Crea el esquema y lo puebla con datos de prueba.
--
--  Modelo de aislamiento: TODA tabla de negocio ('records') está vinculada a un
--  'tenant_id'. La seguridad NO depende del cliente: el backend siempre filtra
--  por el tenant resuelto en los middlewares.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS multitenant_db;
USE multitenant_db;

-- Forzamos UTF-8 (utf8mb4) en la conexión para que los acentos y caracteres
-- especiales se importen correctamente (evita "mojibake").
SET NAMES utf8mb4;

-- Aseguramos que el usuario de la app pueda operar sobre la base de datos.
GRANT ALL PRIVILEGES ON multitenant_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;

-- -----------------------------------------------------------------------------
-- Limpieza previa (idempotencia): permite re-ejecutar el script sin errores.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

-- -----------------------------------------------------------------------------
-- Tabla TENANTS
-- -----------------------------------------------------------------------------
CREATE TABLE tenants (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(50)  NOT NULL,           -- identificador público (URL / header)
  name        VARCHAR(150) NOT NULL,           -- nombre comercial
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenants_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla USERS
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     INT UNSIGNED NOT NULL,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,         -- contraseña hasheada con bcrypt
  role          ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_tenant_email (tenant_id, email),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla RECORDS
-- 'reference' es el código de negocio legible (ej: REC-A-000123). El PK 'id'
-- sigue siendo numérico interno para no romper relaciones; 'reference' es lo
-- que se muestra al usuario, consecutivo por tenant.
-- -----------------------------------------------------------------------------
CREATE TABLE records (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id   INT UNSIGNED NOT NULL,
  reference   VARCHAR(20)  NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT         NULL,
  status      ENUM('ACTIVO','PENDIENTE','ARCHIVADO') NOT NULL DEFAULT 'ACTIVO',
  amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_records_reference (reference),
  KEY idx_records_tenant (tenant_id),
  CONSTRAINT fk_records_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
--  DATOS DE PRUEBA (DATA DUMMY)
-- =============================================================================

INSERT INTO tenants (id, slug, name) VALUES
  (1, 'tenant-a', 'Empresa Alfa S.A.'),
  (2, 'tenant-b', 'Comercial Beta Ltda.');

-- Usuarios. Todos comparten la contraseña "password123" (hash bcrypt).
INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES
  (1, 'Admin Alfa', 'admin@alfa.com', '$2b$10$cRGQuV6nDKdQ5UbtWvnCX.T7w/.9OJfRtXZuD7iqnUuMBE7tu.zSi', 'ADMIN'),
  (1, 'Usuario Alfa', 'user@alfa.com',  '$2b$10$cRGQuV6nDKdQ5UbtWvnCX.T7w/.9OJfRtXZuD7iqnUuMBE7tu.zSi', 'USER'),
  (2, 'Admin Beta',  'admin@beta.com', '$2b$10$cRGQuV6nDKdQ5UbtWvnCX.T7w/.9OJfRtXZuD7iqnUuMBE7tu.zSi', 'ADMIN'),
  (2, 'Usuario Beta','user@beta.com',  '$2b$10$cRGQuV6nDKdQ5UbtWvnCX.T7w/.9OJfRtXZuD7iqnUuMBE7tu.zSi', 'USER');

-- -----------------------------------------------------------------------------
-- Generación masiva de records (500 por tenant) con CTE recursivo.
--   · reference: REC-{letra del tenant}-{secuencia 6 dígitos}, consecutiva.
--   · created_at: distribuido aleatoriamente en los últimos 30 días para que
--     el gráfico de tendencia por fecha sea significativo.
-- -----------------------------------------------------------------------------
INSERT INTO records (tenant_id, reference, title, description, status, amount, created_at)
WITH RECURSIVE numeros (n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numeros WHERE n < 500
)
SELECT
  t.id AS tenant_id,
  CONCAT('REC-', UPPER(SUBSTRING(t.slug, 8)), '-', LPAD(n, 6, '0'))          AS reference,
  CONCAT('Registro ', UPPER(SUBSTRING(t.slug, 8)), '-', LPAD(n, 4, '0'))     AS title,
  CONCAT('Registro de negocio de prueba número ', n, ' del tenant ', t.name) AS description,
  ELT(1 + (n % 3), 'ACTIVO', 'PENDIENTE', 'ARCHIVADO')                       AS status,
  ROUND(RAND() * 10000, 2)                                                   AS amount,
  (NOW() - INTERVAL FLOOR(RAND() * 30) DAY - INTERVAL FLOOR(RAND() * 86400) SECOND) AS created_at
FROM tenants t
JOIN numeros;  -- producto cartesiano: cada número se cruza con cada tenant

-- =============================================================================
--  Verificación rápida (se imprime en los logs del contenedor al inicializar).
-- =============================================================================
SELECT t.slug AS tenant, COUNT(r.id) AS total_records, MIN(r.reference) AS primera_ref
FROM tenants t
LEFT JOIN records r ON r.tenant_id = t.id
GROUP BY t.id, t.slug;
