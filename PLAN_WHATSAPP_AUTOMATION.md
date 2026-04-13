# Plan: Automatización WhatsApp para Gyms — FitFlow

## Estado al 2026-04-13

### ✅ COMPLETADO

#### Supabase (producción)
- Migración corrida en proyecto `ilxnmxunzpugdredtixa`
- Columnas agregadas a tabla `gyms`:
  - `whatsapp_enabled boolean DEFAULT false`
  - `evolution_instance_name text`
  - `evolution_api_url text`
- Token Supabase actualizado en `~/.claude/.mcp.json` — activa con reinicio de Claude Code

#### Backend (rama `claude/n8n-automations`, SIN COMMITEAR AÚN)
- `backend/sql/add_whatsapp_to_gyms.sql` — migración (ya aplicada en prod)
- `backend/services/gyms.supabase.js` — función `updateGymWhatsapp()`
- `backend/controllers/gyms.controller.js` — handler `handleUpdateGymWhatsapp()`
- `backend/routes/gyms.routes.js` — ruta `PATCH /:id/whatsapp`

#### Frontend (rama `claude/n8n-automations`, SIN COMMITEAR AÚN)
- `frontend/hooks/gyms/useGyms.ts` — hooks `useListGyms()` + `useUpdateGymWhatsapp()`
- `frontend/const/headerTabs.tsx/sideBarTabs.tsx` — tab "WhatsApp" en sidebar owner
- `frontend/app/dashboard/owner/whatsapp/page.tsx` — página nueva con lista de gyms + toggles

#### n8n (local, probado y funcionando)
- Workflow en `FitFlow/n8n/whatsapp_recordatorios_workflow.json`
- Probado con alumno mock (Javier Siacca, 543512301223)
- Mensaje real llegó al WhatsApp ✓
- Nodo de envío usa Code node con `require('http')` (fetch no disponible en sandbox)
- n8n necesita arrancar con: `$env:NODE_FUNCTION_ALLOW_BUILTIN="http,https"; n8n start`

#### Evolution API (local, funcionando)
- Instalado en `C:/Users/pacho/evolution-api/`
- PostgreSQL 17 local: host=127.0.0.1, user=evolution_user, pass=evolution_pass, db=evolution_api
- `.env` configurado con `DATABASE_SAVE_DATA_INSTANCE=true`
- Instancia `gymspace-test` creada y conectada (estado: open)
- API key local: `fitflow-local-key`
- Puerto: 8080

---

## 🔜 PENDIENTE

### 1. Commit del código (próximo paso inmediato)
```bash
cd /c/Users/pacho/FitFlow
git add backend/ frontend/ .gitignore backend/sql/
git commit -m "feat: WhatsApp automation — backend endpoint + owner panel"
# PR a main → merge → Render/Vercel auto-deploy
```

### 2. Deploy Evolution API en Render (free tier)
- Imagen Docker: `atendai/evolution-api:latest`
- Necesita PostgreSQL externa: **Neon** (gratis, crear en neon.tech)
- Variables de entorno:
  ```env
  SERVER_PORT=10000
  SERVER_URL=https://<nombre>.onrender.com
  DATABASE_PROVIDER=postgresql
  DATABASE_CONNECTION_URI=<Neon connection string>
  DATABASE_CONNECTION_CLIENT_NAME=evolution_fitflow
  DATABASE_SAVE_DATA_INSTANCE=true
  DATABASE_SAVE_DATA_NEW_MESSAGE=false
  DATABASE_SAVE_DATA_CONTACTS=false
  DATABASE_SAVE_DATA_CHATS=false
  DATABASE_SAVE_DATA_HISTORIC=false
  AUTHENTICATION_API_KEY=<openssl rand -hex 32>
  CORS_ORIGIN=https://fitnessflow.com.ar
  TELEMETRY_ENABLED=false
  DEL_INSTANCE=false
  ```
- Ping cron cada 14 min (mismo servicio que usa el backend) → `https://<evolution>.onrender.com/`
- Con `DATABASE_SAVE_DATA_INSTANCE=true`: sesión WhatsApp sobrevive reinicios sin re-escanear QR

### 3. Agregar env vars al backend en Render
```env
EVOLUTION_API_URL=https://<evolution>.onrender.com
EVOLUTION_API_KEY=<misma clave>
```

### 4. n8n en producción (dos opciones)
**Opción A — Cron en el backend (recomendada, sin servicio extra):**
- Usar `node-cron` dentro del backend Express
- Corre a las 10 AM ARG diario
- Consulta gyms con `whatsapp_enabled = true`
- Para cada gym: obtiene alumnos vencidos → llama a Evolution API

**Opción B — n8n en Render (free tier):**
- Imagen Docker n8n
- Necesita otra DB en Neon
- Ping cron para no hibernar
- `NODE_FUNCTION_ALLOW_BUILTIN=http,https` como env var
- Workflow: cambiar Manual Trigger → Cron, alumno mock → query Supabase real

### 5. QR por gym en producción
- Owner entra al panel `/dashboard/owner/whatsapp`
- Carga `evolution_instance_name` y `evolution_api_url` para cada gym
- Falta implementar: botón "Conectar WhatsApp" que muestre QR del gym
- El QR lo genera Evolution API: `GET {evolution_api_url}/instance/connect/{instance_name}`

---

## Infraestructura

| Servicio | URL | Estado |
|---|---|---|
| Backend | https://fitnessflow.onrender.com | ✅ Prod |
| Frontend | https://fitnessflow.com.ar | ✅ Prod |
| Supabase | ilxnmxunzpugdredtixa | ✅ Migración aplicada |
| Evolution API | localhost:8080 (local) / TBD (prod) | 🔜 Deploy pendiente |
| n8n | localhost:5678 (local) / TBD (prod) | 🔜 Deploy pendiente |
| PostgreSQL local | 127.0.0.1:5432 | ✅ Solo local |

## Gyms en producción
```
e0e69af7  HerGym
c45b7b08  Vakhan
fd56aa99  Gymspace
68887b53  EvolutionAcademy
2801bf02  Ozaru
```

## Credenciales locales (NUNCA commitear)
- PostgreSQL local: user=evolution_user, pass=evolution_pass, db=evolution_api, postgres pass=postgres
- Evolution API local: apikey=fitflow-local-key
- Supabase token MCP: sbp_d7744aca2eaad66164ada781e2092b023eb85d40 (en ~/.claude/.mcp.json)
- n8n local: http://localhost:5678 (sin auth)

## Archivos clave
```
FitFlow/
├── PLAN_WHATSAPP_AUTOMATION.md          ← este archivo
├── n8n/
│   └── whatsapp_recordatorios_workflow.json  ← workflow n8n (en .gitignore)
├── backend/
│   ├── sql/add_whatsapp_to_gyms.sql     ← migración (ya aplicada)
│   ├── services/gyms.supabase.js        ← updateGymWhatsapp()
│   ├── controllers/gyms.controller.js   ← handleUpdateGymWhatsapp()
│   └── routes/gyms.routes.js            ← PATCH /:id/whatsapp
└── frontend/
    ├── hooks/gyms/useGyms.ts            ← useListGyms() + useUpdateGymWhatsapp()
    ├── const/headerTabs.tsx/sideBarTabs.tsx ← tab WhatsApp owner
    └── app/dashboard/owner/whatsapp/page.tsx ← panel owner
```

## Stack de la automatización
- **Evolution API**: gateway WhatsApp (Baileys), una instancia por gym
- **n8n / node-cron**: orquestador diario
- **Supabase**: tabla `gyms` con columnas WhatsApp
- **Backend**: endpoint PATCH para configurar WhatsApp por gym
- **Frontend**: panel owner para gestionar configuración

## Notas importantes
- El número de WhatsApp debe enviarse con código de país: `54` + número (ej: `543512301223`)
- Evolution API normaliza automáticamente a `5493512301223` (agrega el 9 de móvil)
- Delay de 4 segundos entre mensajes para evitar ban de WhatsApp
- La sesión de WhatsApp se guarda en PostgreSQL → sobrevive reinicios si DB persiste
- n8n Code node necesita `NODE_FUNCTION_ALLOW_BUILTIN=http,https` para hacer HTTP requests
