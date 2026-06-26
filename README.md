<div align="center">

# 🏢 Arquitectura Multi-Tenant · Full-Stack

### Slice Vertical con aislamiento estricto de datos, JWT, control de roles y una capa visual estilo iOS

**Desarrollado por [Nicolás Uribe](mailto:nicolasuribe753@gmail.com)** · Prueba técnica para **Concept BPO**

</div>

---

> Este proyecto no busca ser un sistema completo, sino **demostrar el dominio de
> los conceptos clave** de una arquitectura multi-tenant: aislamiento de datos
> gobernado por el servidor, autenticación, control por roles y optimización de
> render — todo envuelto en una experiencia de usuario cuidada y moderna.
>
> Construí la base cumpliendo cada criterio de evaluación y, sobre esa base
> sólida y sin alterar su lógica, añadí una capa de diseño y funcionalidades que
> le dan identidad de producto real. — *N.U.*

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
| UI / Animación | **Framer Motion** + tipografía **Inter** |

---

## ✨ Toque diferencial (valor agregado)

Más allá de los requisitos, este proyecto incorpora:

- **🎨 Diseño glassmorphism estilo iOS** — paleta de azules sobre negros/grises,
  tarjetas con desenfoque, esquinas suaves y sombras en capas.
- **🌌 Fondo "aurora" animado** — gradientes azules en movimiento + malla sutil,
  puro CSS para máximo rendimiento (respeta `prefers-reduced-motion`).
- **📊 Tarjetas de métricas** — total de registros, monto acumulado y desglose
  por estado, alimentadas por un endpoint de estadísticas filtrado por tenant.
- **➕ Modal "Nuevo registro"** (solo ADMIN) — creación desde la UI con feedback
  inmediato y actualización reactiva de métricas.
- **🔔 Sistema de toasts** y **💀 skeletons de carga** — feedback premium.
- **🪄 Microinteracciones y transiciones** con Framer Motion.
- **🔑 Credenciales de prueba en acordeón clickeable** — autocompletan el login.

> ⚠️ **Regla de oro del diferencial:** nada de lo anterior modifica la lógica de
> seguridad ni los criterios evaluados. Es una capa **aditiva** sobre un núcleo
> que ya funcionaba al 100 %.

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
        ├── components/       # AnimatedBackground, Logo, Toast, Skeleton,
        │                     # MetricCards, CreateRecordModal, RecordRow,
        │                     # ProtectedRoute
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

> 💡 Para ver el logo real de Concept BPO en el login, coloca el archivo en
> `frontend/public/logo-concept-bpo.svg`. Si no existe, se muestra un wordmark
> elegante por defecto.

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
| GET | `/records/stats` | Métricas agregadas del tenant | ADMIN, USER |
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
- **Control por roles.** La creación de records está restringida a `ADMIN`
  (en backend con `requireRole` y en la UI ocultando la acción).
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
| USER intenta `POST /records` | 403 (y la UI ni muestra la opción) |
| Inyectar `tenant_id` ajeno en el body | Ignorado (se usa el del servidor) |

---

<div align="center">

### 👤 Sobre el autor

Desarrollado con dedicación por **Nicolás Uribe**
*Apasionado por construir software que funcione impecable y se vea aún mejor.*

📧 nicolasuribe753@gmail.com

</div>
