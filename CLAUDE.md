# FitFlow — Guía para Claude Code

## Qué es FitFlow

SaaS de gestión de gimnasios. Permite a gimnasios administrar socios, pagos, planes, asistencias, turnos, clases, productos y estadísticas. Tiene un portal público donde los socios pueden reservar turnos.

**Dominio productivo:** https://fitnessflow.com.ar

---

## Stack

| Capa | Tecnología | Deploy |
|---|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, MUI, React Query | Vercel |
| Backend | Node.js + Express 5, ES Modules | Render |
| Base de datos | Supabase (PostgreSQL) | Supabase Cloud |
| Auth | Supabase Auth (JWT via cookies) | Supabase Cloud |
| Real-time | Socket.io | Embebido en backend |
| Email | Brevo (ex-Sendinblue) | — |
| Storage | Supabase Storage (imágenes) | Supabase Cloud |

---

## Estructura del repo

```
FitFlow/
├── backend/          # Express API (Node.js, ES Modules)
│   ├── server.js     # Entry point: monta rutas, Socket.io, CORS
│   ├── controllers/  # Lógica de cada recurso
│   ├── routes/       # Definición de rutas Express
│   ├── services/     # Queries a Supabase (*.supabase.js)
│   ├── middleware/
│   │   ├── auth.js           # verifyToken — valida JWT con Supabase Admin
│   │   └── supaPerRequest.js # Crea cliente Supabase con el token del usuario (RLS)
│   ├── db/supabaseClient.js  # supabase (anon) + supabaseAdmin (service_role)
│   ├── emails/       # Integración Brevo
│   ├── loaders/      # alumnosLoader (DataLoader para N+1)
│   └── sql/          # Migraciones manuales SQL
└── frontend/         # Next.js App Router
    ├── app/          # Páginas (App Router)
    │   ├── dashboard/administrator/  # Vistas del administrador
    │   ├── dashboard/receptionist/   # Vistas del recepcionista
    │   ├── dashboard/owner/          # Registro de gym (owner)
    │   ├── gym/[gymSlug]/            # Portal público del gym
    │   └── login/, forgot-password/, reset-password/
    ├── hooks/        # Custom hooks por dominio (React Query)
    ├── components/   # Componentes UI reutilizables
    ├── context/      # UserContext, SubscriptionContext, DarkModeContext
    ├── lib/
    │   ├── api.ts    # Instancia axios con Bearer token automático
    │   └── socket.ts # Cliente Socket.io
    ├── models/       # Tipos TypeScript por dominio
    └── const/        # Definiciones de inputs para formularios
```

---

## Auth

- **Supabase Auth** maneja usuarios. El JWT se guarda en una cookie llamada `token`.
- El frontend la envía como `Authorization: Bearer <token>` via el interceptor en `frontend/lib/api.ts`.
- El backend valida con `supabaseAdmin.auth.getUser(token)` (cachea 5 min).
- `req.gymId` se extrae de `user.user_metadata.gym_id` en cada request autenticado.
- El middleware `supaPerRequest` crea un cliente Supabase con el token del usuario, activando RLS.

**Cookies del frontend (en UserContext):**
- `token` — JWT de Supabase Auth
- `id`, `dni`, `rol`, `gym_id` — datos del usuario logueado

**Roles:** `owner` (dueño de gym, registra el gym), `administrator`, `receptionist`

---

## API del Backend

Base URL local: `http://localhost:3001`  
Base URL producción (Render): configurado en `NEXT_PUBLIC_BACKEND_URL` del frontend.

**Rutas principales:**

| Ruta | Recurso | Auth |
|---|---|---|
| `GET /ping` | Health check | No |
| `/api/auth` | Login, register | No |
| `/api/alumnos` | Socios/miembros | JWT |
| `/api/alumnos/expired` | Socios vencidos | JWT |
| `/api/alumnos/simple` | Lista liviana para búsqueda | JWT |
| `/api/pagos` | Pagos | JWT |
| `/api/planes` | Planes del gym | JWT |
| `/api/stats` | Estadísticas del dashboard | JWT |
| `/api/asistencias` | Asistencias | No (verificar) |
| `/api/turnos` | Appointments (admin) | No (verificar) |
| `/api/public/appointments` | Turnos públicos (portal gym) | No |
| `/api/clases` | Clases | JWT |
| `/api/sesiones` | Sesiones de clases | No |
| `/api/gym-plans` | Planes de suscripción del gym a FitFlow | JWT |
| `/api/suscriptions` | Suscripciones de socios a planes | JWT |
| `/api/productos` | Productos | No |
| `/api/servicios` | Servicios del gym | No |
| `/api/novedades` | Novedades/noticias | No |
| `/api/payment-methods` | Métodos de pago | No |
| `/api/gyms` | Datos del gym | No |
| `/api/users` | Usuarios del sistema | JWT |
| `/api/emails` | Envío de emails | No |
| `/api/roles` | Roles | JWT |

---

## Variables de entorno

**Backend** (`.env.local` para dev, `.env` para prod):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
PORT=3001
```

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001   # en prod: URL de Render
```

---

## Real-time (Socket.io)

- El backend emite eventos por sala `gym:<gymId>`.
- El frontend se conecta en `frontend/lib/socket.ts`.
- La función `emitToGym(gymId, event, payload)` en `server.js` es la que se usa en los controllers para notificar cambios en tiempo real.

---

## Dominio clave del negocio

- **Gym**: cada instancia/cliente de FitFlow. Tiene `gym_id` (UUID).
- **Alumno/Socio**: miembro del gym. Tiene `dni`, `nombre`, `telefono`, `fecha_de_vencimiento`, `plan_nombre`, `plan_precio`.
- **Plan**: plan de membresía (ej: "Musculación 3 veces/semana"). Precio y duración.
- **Pago**: registro de un cobro a un alumno.
- **Asistencia**: registro de entrada/salida del gym.
- **Turno/Appointment**: reserva de horario.
- **Clase**: tipo de actividad (ej: spinning, yoga).
- **Sesión**: instancia de una clase en un horario.
- **Novedad**: publicación/anuncio del gym (visible en el portal).
- **Portal**: página pública `fitnessflow.com.ar/gym/[slug]` donde los socios pueden ver info y reservar turnos.

---

## Automatizaciones con n8n

**Objetivo:** conectar n8n a la API de FitFlow y/o Supabase para automatizar notificaciones y procesos del gym.

**Casos de uso planeados:**
- Recordatorio de vencimiento de membresía (WhatsApp / email)
- Notificación de nuevo pago registrado
- Alertas de socios inactivos
- Reportes periódicos al administrador

**Integración con la API:**
- n8n hace requests HTTP al backend con `Authorization: Bearer <token>`.
- El token se obtiene via `/api/auth` (login).
- Para automatizaciones sin usuario interactivo: usar un usuario de servicio o service_role key de Supabase directamente para leer datos.

**Integración directa con Supabase:**
- n8n tiene nodo nativo de Supabase (usa `SUPABASE_URL` + `SUPABASE_ANON_KEY` o `SERVICE_ROLE_KEY`).
- Útil para triggers en tiempo real via Supabase Webhooks → n8n Webhook node.

**Referencia WhatsApp (implementación existente):**  
Ver `automatizacion_whatsapp.md` — script Python con Playwright que consume `/api/alumnos/expired` y envía mensajes por WhatsApp Web.

---

## Convenciones del código

- **Backend**: ES Modules (`import/export`), sin CommonJS. Patrón `controller → service (supabase)`.
- **Frontend**: TypeScript estricto. Hooks de React Query por dominio en `hooks/`. Formularios con `react-hook-form` + `zod`.
- **Estilos**: Tailwind CSS + MUI (conviven). Tema oscuro soportado via `DarkModeContext`.
- **API calls del frontend**: siempre via `api` (axios instance de `lib/api.ts`), nunca `fetch` directo al backend.

---

## Comandos

```bash
# Backend
cd backend && npm run dev     # nodemon server.js en puerto 3001

# Frontend
cd frontend && npm run dev    # Next.js en puerto 3000
cd frontend && npm test       # Jest (unit tests)
cd frontend && npm run test:e2e  # Playwright (e2e)
```
