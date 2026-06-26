# Prueba Técnica — Arquitectura Multi-Tenant (Full-Stack)

Implementación de un **Slice Vertical** que demuestra una arquitectura
**Multi-Tenant** con aislamiento estricto de datos entre inquilinos (tenants),
autenticación con JWT, control por roles y optimización de render en el frontend.

> Prueba para **Concept BPO**. El objetivo no es un sistema completo, sino
> demostrar el dominio de los conceptos clave de seguridad y arquitectura.

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Base de datos | **MySQL 8** (en Docker) |
| Backend | **Node.js 20 + Express + TypeScript** |
| Acceso a datos | **mysql2** (driver) con SQL parametrizado |
| Autenticación | **JWT** (`jsonwebtoken`) + **bcryptjs** |
| Frontend | **React + Vite + TypeScript** |
| Estado global | **Redux Toolkit** |
| Routing | **react-router-dom v6** |
| HTTP | **axios** (con interceptores) |

---

## 📁 Estructura del proyecto

```
prueba-concept-bpo/
├── docker-compose.yml        # Levanta MySQL 8
├── database/
│   └── init.sql              # Migración + datos de prueba (se ejecuta solo)
├── backend/
│   └── src/
│       ├── config/           # Variables de entorno
│       ├── db/               # Pool de conexión mysql2
│       ├── middlewares/      # identifyTenant, checkAuth, errorHandler
│       ├── services/         # Lógica de acceso a datos (SQL)
│       ├── controllers/      # Orquestación de las peticiones HTTP
│       ├── routes/           # Definición de endpoints /api/v1
│       ├── types/            # Tipos compartidos
│       ├── app.ts            # Configuración de Express
│       └── server.ts         # Punto de entrada
└── frontend/
    └── src/
        ├── api/              # Instancia axios + interceptores
        ├── store/            # Redux: authSlice, recordsSlice, store
        ├── hooks/            # useDebounce, hooks tipados de Redux
        ├── components/       # ProtectedRoute, RecordRow (memoizado)
        ├── pages/            # LoginPage, DashboardPage
        └── App.tsx           # Routing dinámico
```

---

## 🚀 Puesta en marcha (paso a paso)

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (encendido)
- [Node.js 20+](https://nodejs.org/)

### 1. Levantar la base de datos
Desde la raíz del proyecto:
```bash
docker compose up -d
```
Esto crea un contenedor MySQL 8 y ejecuta **automáticamente** `database/init.sql`,
que crea las tablas y carga los datos de prueba (2 tenants, 4 usuarios y
1000 registros, 500 por tenant).

> Para reiniciar la base desde cero: `docker compose down -v && docker compose up -d`

### 2. Levantar el backend
```bash
cd backend
cp .env.example .env      # en Windows PowerShell: copy .env.example .env
npm install
npm run dev
```
Servidor en **http://localhost:4000** · Healthcheck: `GET /health`

### 3. Levantar el frontend
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
Aplicación en **http://localhost:5173** (o el puerto que asigne Vite).

---

## 🔑 Credenciales de prueba

Todos los usuarios comparten la contraseña **`password123`**.

| Tenant | Email | Rol |
|--------|-------|-----|
| `tenant-a` (Empresa Alfa S.A.) | `admin@alfa.com` | ADMIN |
| `tenant-a` | `user@alfa.com` | USER |
| `tenant-b` (Comercial Beta Ltda.) | `admin@beta.com` | ADMIN |
| `tenant-b` | `user@beta.com` | USER |

---

## 🔌 API (endpoints)

Base: `http://localhost:4000/api/v1`
Toda petición protegida requiere las cabeceras:
`X-Tenant-ID: <slug>` y `Authorization: Bearer <token>`.

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/login` | Autentica y devuelve el JWT (requiere `X-Tenant-ID`) | Público |
| GET | `/records?limit=&offset=` | Lista records del tenant (paginado) | ADMIN, USER |
| POST | `/records` | Crea un record en el tenant | Solo ADMIN |

### Ejemplo con curl
```bash
# 1) Login
curl -X POST http://localhost:4000/api/v1/login \
  -H "X-Tenant-ID: tenant-a" -H "Content-Type: application/json" \
  -d '{"email":"admin@alfa.com","password":"password123"}'

# 2) Listar records (usar el token recibido)
curl http://localhost:4000/api/v1/records?limit=5 \
  -H "X-Tenant-ID: tenant-a" -H "Authorization: Bearer <TOKEN>"
```

---

## 🛡️ Decisiones de seguridad y arquitectura

- **El servidor gobierna la seguridad.** El `tenant_id` se toma SIEMPRE del
  contexto resuelto por el backend (header validado + token), nunca del body ni
  de parámetros que el cliente pueda manipular.
- **Aislamiento por doble verificación.** `identifyTenant` valida el tenant
  contra la BD; `checkAuth` exige además que el tenant del JWT coincida con el
  tenant solicitado. Un token de `tenant-a` contra `tenant-b` devuelve **403**.
- **Control por roles.** La creación de records está restringida a `ADMIN`.
- **Anti "data bleeding".** Al cerrar sesión se resetea TODO el estado de Redux,
  evitando que queden datos residuales de un tenant anterior.
- **DRY.** La lógica repetitiva de red y seguridad se centraliza en
  interceptores de axios (frontend) y middlewares (backend).
- **Optimización de render.** La tabla usa `debounce` en la búsqueda, `useMemo`
  para el filtrado y `React.memo` en las filas, para no degradar la UI con
  grandes volúmenes de datos.

---

## ✅ Matriz de pruebas de seguridad

| Escenario | Resultado esperado |
|-----------|--------------------|
| Login válido | 200 + token |
| GET records con token del propio tenant | 200, solo sus datos |
| Token de tenant A contra header de tenant B | **403** |
| Petición sin token | 401 |
| Header `X-Tenant-ID` inexistente | 404 |
| USER intenta `POST /records` | 403 |
| Inyectar `tenant_id` ajeno en el body | Ignorado (se usa el del servidor) |
