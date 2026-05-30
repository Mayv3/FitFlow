# Módulo de WhatsApp — Gymspace

Documentación completa del módulo de envío automático de WhatsApp. Pensada para exportar este "feature" a otro proyecto sin perder contexto.

---

## 1. Resumen ejecutivo

El módulo envía mensajes de WhatsApp **desde un número personal real** (no API oficial, no Twilio) usando **Baileys**, que es una implementación open-source del protocolo WhatsApp Web sobre WebSocket. La sesión se autentica una sola vez escaneando un QR con el celular y queda persistida en **Supabase** (no en disco), lo que permite reiniciar el servidor o desplegarlo en plataformas serverless / containers efímeros (Render, Railway, Fly.io) sin volver a escanear.

Casos de uso actuales:

1. **Recordatorios automáticos** a alumnos cuyo plan vence en exactamente 4 días.
2. **Mensaje de control** al admin (`MI_NUMERO`) al iniciar la sesión.
3. **Alertas por email (Brevo)** cuando WhatsApp se desconecta o falla un envío.
4. **Histórico** de mensajes enviados en la tabla `whatsapp_mensajes` (visible en el dashboard).

Disparo: por endpoint HTTP (`POST /api/trigger-whatsapp`). No hay cron interno; el llamado se hace desde un scheduler externo (Cloudflare Cron, GitHub Action, EasyCron, etc.) o manualmente desde el panel.

---

## 2. Stack y librerías

### Backend (Node.js / ESM)

| Librería | Versión (package.json) | Para qué |
|---|---|---|
| `@whiskeysockets/baileys` | `^7.0.0-rc.9` | Cliente WhatsApp Web (WebSocket, Signal protocol) |
| `@supabase/supabase-js` | `^2.58.0` | Persistencia de credenciales y mensajes |
| `dayjs` (+ `customParseFormat`) | `^1.11.13` | Fechas, parseo `D/M/YYYY` |
| `dotenv` | `^16.5.0` | Variables de entorno |
| `node-fetch` | (transitiva) | Llamadas a Brevo (alertas email) |
| `qrcode-terminal` | `^0.12.0` (transitiva en deps pero usada) | Imprimir QR en stdout para login |
| `pino` | (transitiva) | Logger silencioso de Baileys |
| `@hapi/boom` | (transitiva) | Detectar status code de desconexión |

> **Atención al exportar**: `package.json` actual depende implícitamente de `pino`, `@hapi/boom`, `node-fetch` y `qrcode-terminal` (algunos vienen como peerDeps de Baileys, otros faltan declarados). Cuando se mueva el módulo a otro repo, **declararlos explícitamente** para evitar romperse en `npm ci`:
>
> ```bash
> npm i @whiskeysockets/baileys @hapi/boom pino qrcode-terminal node-fetch dayjs @supabase/supabase-js dotenv
> ```

### Frontend (Next.js / React)

| Librería | Para qué |
|---|---|
| `axios` | Fetch al endpoint del dashboard |
| `dayjs` (`/locale/es`) | Formato fechas |
| `@mui/material` (`CircularProgress`) | Spinner |
| `lucide-react` (`MessageCircle`) | Ícono |
| shadcn/ui (`Card`, `Dialog`) | Layout de la lista de mensajes |

---

## 3. Estructura de archivos

```
backend/
├── server.js                                  # Arranca Express + llama iniciarWhatsapp() al boot
├── db/
│   └── supabase.js                            # Cliente Supabase con SERVICE_ROLE_KEY
├── services/
│   ├── whatsappBaileysService.js              # Lógica principal (conexión, envío, reconexión, alertas)
│   ├── whatsappSupabaseAuth.js                # AuthState custom que persiste en Supabase
│   └── googleSheets.js                        # getAlumnosFromSheet() — fuente de alumnos
└── routes/
    └── dashboard.routes.js                    # GET /api/dashboard/whatsapp-mensajes (historial)

frontend/
└── components/dashboard/administrator/
    ├── AdminOverviewCharts.tsx                # Importa y renderiza WhatsappMessages
    └── stats/WhatsappMessages.tsx             # UI de últimos 20 mensajes (lista + modal)
```

---

## 4. Variables de entorno (`.env`)

```env
# Supabase (service role — NUNCA exponer en frontend)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Email alerts (Brevo)
BREVO_API_KEY=xkeysib-...
FROM_EMAIL=no-reply@tu-dominio.com

# Server
PORT=3001
```

El número del admin (destinatario de alertas internas vía WhatsApp y del mensaje de inicio) está **hardcodeado** en `whatsappBaileysService.js`:

```js
const MI_NUMERO = '5493513274314@s.whatsapp.net'
```

**Sugerencia al exportar**: moverlo a `process.env.WHATSAPP_ADMIN_JID`.

El email destino de las alertas también está hardcodeado (`nicopereyra855@gmail.com` en `alertarError`/`alertarDesconexion`). Idem: parametrizar.

---

## 5. Modelo de datos (Supabase)

### Tabla `whatsapp_session`

Una **única tabla** guarda toda la sesión de Baileys: credenciales, claves Signal individuales, y metadatos de ejecución. La columna `data` es `jsonb`.

```sql
create table whatsapp_session (
  id          text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
```

Filas que viven en esta tabla:

| `id`                    | Contenido de `data`                                                | Origen |
|-------------------------|--------------------------------------------------------------------|--------|
| `creds`                 | `{ value: "<JSON serializado con BufferJSON>" }` — credenciales del dispositivo (noiseKey, signedIdentityKey, registrationId, etc.) | Baileys `creds.update` |
| `keys:<type>:<id>`      | `{ value: "<JSON serializado>" }` — una fila por **cada** clave Signal (pre-keys, session, sender-keys, app-state-sync). Cientos de filas en operación normal. | Baileys `state.keys.set` |
| `ultima-ejecucion`      | `{ fecha: "DD-MM-YYYY" }` — dedupe diario del trigger             | `triggerRecordatorios()` |

> Originalmente había una sola fila `keys` con **todas** las claves en un blob enorme. La función `migrateKeysBlob()` (en `whatsappSupabaseAuth.js`) detecta esa fila legacy al arranque, la explota en filas por-clave, y la borra. **Idempotente** — se puede dejar corriendo siempre.
>
> El motivo del cambio: el blob unificado generaba upserts gigantes (>10 MB en cuentas con mucho tráfico) y rompía el límite de payload de Supabase.

### Tabla `whatsapp_mensajes`

Histórico de envíos exitosos. Se inserta una fila por cada `sendMessage` que no tira excepción.

```sql
create table whatsapp_mensajes (
  id          bigserial primary key,
  nombre      text,
  telefono    text,           -- formato "549XXXXXXXXXX" (sin '@s.whatsapp.net')
  plan        text,
  vencimiento text,           -- guardado como string "D/M/YYYY" (no es date)
  mensaje     text,
  enviado_at  timestamptz not null default now()
);
```

`enviado_at` se completa por default en Postgres; el código no lo manda.

### Permisos / RLS

El backend usa **service role key**, así que bypasea RLS. Si se exporta a un proyecto con RLS estricto, mantener service role solo en el backend; ningún cliente puede tocar `whatsapp_session` (contiene claves criptográficas privadas).

---

## 6. Custom AuthState — `whatsappSupabaseAuth.js`

Baileys por defecto persiste con `useMultiFileAuthState(folder)` (un archivo por clave en disco). Esto no funciona en hosting efímero. La implementación custom reemplaza ese contrato:

```js
export async function useSupabaseAuthState() {
  await migrateKeysBlob()                              // legacy migration
  const creds = (await read('creds')) ?? initAuthCreds()
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => { /* SELECT IN (keys:type:id, ...) */ },
        set: async (data)      => { /* batched upsert + delete por nulls */ }
      }
    },
    saveCreds: () => write('creds', creds)
  }
}
```

Puntos clave:

- **Serialización**: usa `BufferJSON.replacer` / `BufferJSON.reviver` (exportados por Baileys) — esto preserva los `Buffer` de Node, que son críticos para las claves Signal. Sin esto la sesión se rompe al releerse.
- **`keys.get`**: batch lookup `where id in (...)`. Devuelve `{ keyId: value }`. Si una fila viene corrupta, la saltea en silencio (try/catch) — Baileys reintenta.
- **`keys.set`**: itera el diff que manda Baileys. `null` → borrar fila. Valor → upsert. Ambas operaciones se ejecutan con `Promise.all` por performance.
- **`saveCreds`**: closure sobre `creds` — Baileys muta el objeto in-place, y este callback lo persiste cada vez que cambia (typically post-handshake, post-pre-key-upload, etc.).

Si se reemplaza el storage backend (Redis, DynamoDB, Mongo), **respetar exactamente el shape de la API**: dos métodos `get(type, ids[]) → {id: value}` y `set(data)` donde `data` es `{type: {id: value|null}}`.

---

## 7. Servicio principal — `whatsappBaileysService.js`

### 7.1 Inicialización (`iniciarWhatsapp`)

```js
sock = makeWASocket({
  version,                                              // fetchLatestBaileysVersion()
  browser: Browsers.ubuntu('Chrome'),                   // string identificación dispositivo
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)  // CACHE EN MEMORIA encima de Supabase
  },
  logger,                                               // pino silent
  connectTimeoutMs: 60000,
  retryRequestDelayMs: 2000
})
```

- `makeCacheableSignalKeyStore`: capa de caché LRU sobre el storage. Baileys consulta cientos de claves por mensaje; sin este wrapper cada envío hace ~10 round-trips a Supabase. **Mantenerlo siempre**.
- `Browsers.ubuntu('Chrome')`: aparece como "Chrome (Ubuntu)" en *Dispositivos vinculados* del celu. Cambiar para identificar la instancia (`Browsers.macOS('Desktop')`, etc.).
- `fetchLatestBaileysVersion()`: descarga la última versión del protocolo de WhatsApp Web que conoce el servidor de Baileys. Sin esto, WhatsApp puede rechazar el handshake con "version mismatch" cuando WA actualiza.

### 7.2 Eventos

```js
sock.ev.on('creds.update', saveCreds)
sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => { ... })
```

- **`qr`**: aparece la primera vez (o tras logout). Se imprime en terminal con `qrcode-terminal`. **El usuario lo escanea con WhatsApp → Dispositivos vinculados → Vincular dispositivo**. Una vez escaneado, Baileys completa el handshake, dispara `creds.update`, y la sesión queda guardada en Supabase.
- **`connection === 'open'`**: enviamos un mensaje de control a `MI_NUMERO` ("✅ Sesión de WhatsApp abierta correctamente"). `mensajeInicioEnviado` previene duplicados si hay reconexiones rápidas. Hay un `await new Promise(r => setTimeout(r, 3000))` antes — Baileys recomienda esperar unos segundos post-`open` antes del primer envío, sino algunos mensajes caen en el limbo.
- **`connection === 'close'`**: extrae el `statusCode` del error vía `@hapi/boom`. Si **no** es `DisconnectReason.loggedOut` → reintenta tras 3s. Si **sí** (sesión cerrada manualmente desde el celu, banneo, etc.) → manda email de alerta y espera escaneo manual.

### 7.3 Override de `console.log`

```js
const _origLog = console.log
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Closing session')) return
  _origLog(...args)
}
```

Baileys spammea "Closing session …" en cada negociación de pre-key. Esto silencia *solo* esa línea, sin tocar el resto del logging.

### 7.4 Lógica de recordatorios (`procesarRecordatorios`)

```js
const alumnos = await getAlumnosFromSheet()           // viene de Supabase, no Sheets
const porVencer = alumnos.filter(a => {
  const venc = dayjs(a.Fecha_vencimiento, 'D/M/YYYY').startOf('day')
  const hoy  = dayjs().startOf('day')
  return venc.diff(hoy, 'day') === 4                  // exactamente 4 días
})
```

Para cada alumno se construye el JID así:

```js
const numero = alumno.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')
const jid    = `549${numero}@s.whatsapp.net`
```

- **`replace(/^0/, '')`**: saca el `0` inicial de números argentinos viejos (ej. `0351...` → `351...`).
- **`replace(/[^0-9]/g, '')`**: limpia espacios, guiones, paréntesis.
- **Prefijo `549`**: código de país Argentina (`54`) + el dígito `9` que WhatsApp requiere para móviles arg. **Si se exporta a otro país, cambiar este prefijo o parametrizarlo**.

> Limitación: el código asume formato argentino. Para multi-país conviene pasar el alumno con campo `country_code` y construir el JID dinámicamente.

Mensaje:

```js
const mensaje = `Hola ${alumno.Nombre}, desde Gymspace te informamos que tu plan de ${alumno.Plan} vence el ${alumno.Fecha_vencimiento}. ¡Renoválo para seguir entrenando duro! 💪❤️`
await sock.sendMessage(jid, { text: mensaje })
await supabase.from('whatsapp_mensajes').insert({ nombre, telefono, plan, vencimiento, mensaje })
```

El envío es **secuencial** (`for ... of`), no en paralelo. WhatsApp banea cuentas que mandan ráfagas. Para tandas más grandes, agregar un `await sleep(2000)` entre envíos.

### 7.5 Dedupe diario (`triggerRecordatorios`)

```js
const hoy = dayjs().format('DD-MM-YYYY')
const { data: ultimaRow } = await supabase
  .from('whatsapp_session')
  .select('data')
  .eq('id', 'ultima-ejecucion')
  .maybeSingle()

if (ultimaRow?.data?.fecha === hoy) {
  return { status: 'already_run', message: 'Ya se ejecutó hoy' }
}
```

Tras un envío exitoso, se hace upsert con `fecha: hoy`. Esto vuelve **idempotente** al endpoint: aunque un scheduler externo lo pegue 4 veces en el día, solo manda una vez.

### 7.6 Modo simulación (`simularRecordatorios`)

Mismo flujo, pero `enviar = false`: no llama a `sendMessage` ni inserta en `whatsapp_mensajes`. En lugar de eso, manda al admin un **resumen** con el listado:

```
🧪 Simulación — se enviaría a 7 alumno(s):

1. Juan Perez — MUSCULACION — vence 2/6/2026
2. ...
```

### 7.7 Alertas por email (Brevo)

`alertarError` y `alertarDesconexion` mandan un POST a `https://api.brevo.com/v3/smtp/email` con el body `{sender, to, subject, htmlContent}`. Brevo (ex-Sendinblue) tiene tier gratis (~300 emails/día) ideal para alertas internas. Si se exporta y se prefiere Resend / SES / SendGrid, solo cambia `enviarMailAlerta`.

---

## 8. Endpoints HTTP

Definidos en `server.js`:

| Método | Path | Función | Cuándo usar |
|--------|------|---------|-------------|
| `POST` | `/api/trigger-whatsapp` | `triggerRecordatorios()` | Disparo real diario (cron externo) |
| `POST` | `/api/simulate-whatsapp` | `simularRecordatorios()` | Preview antes de enviar |
| `POST` | `/api/test-whatsapp-error` | `simularError()` | Probar que la alerta por email funciona |

Endpoint de lectura (en `routes/dashboard.routes.js`):

| Método | Path | Query | Devuelve |
|--------|------|-------|----------|
| `GET` | `/api/dashboard/whatsapp-mensajes` | `limit` (default 20, max 100) | Array de mensajes ordenados por `enviado_at desc` |

Tiene `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` para reducir carga.

### Ejemplo de cron externo (cron-job.org / EasyCron)

```
URL:    POST https://api.tudominio.com/api/trigger-whatsapp
Hora:   09:00 ART, todos los días
```

O con GitHub Actions (`.github/workflows/whatsapp-daily.yml`):

```yaml
on:
  schedule:
    - cron: '0 12 * * *'    # 09:00 ART = 12:00 UTC
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST https://api.tudominio.com/api/trigger-whatsapp
```

---

## 9. Frontend — `WhatsappMessages.tsx`

Componente cliente (`"use client"`) que:

1. En `useEffect`, hace `axios.get(${NEXT_PUBLIC_BACKEND_URL}/api/dashboard/whatsapp-mensajes?limit=20)`.
2. Renderiza una `Card` con la lista (nombre, plan, vencimiento, timestamp, preview del mensaje truncado a 2 líneas).
3. Click en un ítem abre un `Dialog` con el mensaje completo + metadata.

Estados: `loading` (spinner verde MUI), `data.length === 0` (texto "No hay mensajes enviados"), o la lista.

Variable de entorno frontend (Next.js):

```env
NEXT_PUBLIC_BACKEND_URL=https://api.tudominio.com
```

Se importa y monta en `AdminOverviewCharts.tsx`:

```tsx
import { WhatsappMessages } from "./stats/WhatsappMessages"
// ...
<WhatsappMessages />
```

---

## 10. Flujo completo (paso a paso)

### Primera vez (deploy inicial)

1. `npm i` con todas las deps declaradas (ver §2).
2. Configurar `.env` con las claves de Supabase y Brevo.
3. Crear las tablas `whatsapp_session` y `whatsapp_mensajes` en Supabase (DDL en §5).
4. Levantar el server: `npm run dev` (o `node server.js`).
5. En los logs del servidor aparece un QR ASCII. Escanearlo desde el celu (Settings → Linked devices).
6. Aparece `✅ WhatsApp conectado`. Llega un WhatsApp al admin: *"Sesión de WhatsApp abierta correctamente"*.
7. Listo. La fila `creds` y ~50–200 filas `keys:*` están en Supabase.

### Día a día

1. Cron externo pega `POST /api/trigger-whatsapp` a las 9 AM.
2. El handler calcula "hoy", lee `ultima-ejecucion`, si ya corrió devuelve `{ status: 'already_run' }`.
3. Si no: trae alumnos desde Supabase (`getAlumnosFromSheet` → tabla `alumnos`), filtra los que vencen en 4 días.
4. Por cada uno: `sock.sendMessage(jid, { text })`, `insert into whatsapp_mensajes`.
5. Al final: upsert `ultima-ejecucion` con `fecha: 'DD-MM-YYYY'`.
6. El dashboard del admin (`/dashboard`) refleja los mensajes en `WhatsappMessages`.

### Reinicio del servidor (deploy nuevo, crash, etc.)

1. `server.listen` ejecuta `iniciarWhatsapp()`.
2. `useSupabaseAuthState()` lee `creds` de Supabase — la sesión sigue válida.
3. Baileys reconecta automáticamente sin QR.
4. Vuelve a mandar el "Sesión abierta" al admin (es el canary de monitoreo).

### Sesión expirada / cerrada manualmente

1. `connection.update` recibe `close` con `statusCode === DisconnectReason.loggedOut`.
2. Se envía email "WhatsApp Gymspace desconectado".
3. Hay que **borrar manualmente** las filas `creds` y `keys:*` de Supabase, reiniciar el server, y volver a escanear.
   - O agregar un endpoint `POST /api/reset-whatsapp-session` que haga `delete from whatsapp_session where id = 'creds' or id like 'keys:%'`.

---

## 11. Checklist para exportar a otro proyecto

- [ ] Copiar los 3 archivos: `whatsappBaileysService.js`, `whatsappSupabaseAuth.js`, `db/supabase.js`.
- [ ] Crear `whatsapp_session` y `whatsapp_mensajes` en el Supabase del nuevo proyecto.
- [ ] Declarar todas las deps en `package.json` (§2), no confiar en transitivas.
- [ ] Parametrizar `MI_NUMERO`, el email destino, el prefijo de país (`549`) y el template del mensaje.
- [ ] Adaptar `getAlumnosFromSheet()` a la fuente de datos del nuevo proyecto (o reemplazar por una query directa).
- [ ] Reemplazar el filtro "vence en 4 días" por la regla de negocio que aplique.
- [ ] Ajustar Brevo → otro proveedor de email si corresponde.
- [ ] Montar los endpoints en el `server.js` / `app.ts` del nuevo proyecto.
- [ ] Configurar un scheduler externo apuntando a `/api/trigger-whatsapp`.
- [ ] Primera vez: levantar local, escanear QR, verificar que llega el "Sesión abierta". Luego desplegar — la sesión persiste.

---

## 12. Cosas a tener en cuenta / riesgos conocidos

1. **Baileys es ingeniería inversa de WhatsApp Web**. WhatsApp puede cambiar el protocolo y romper el cliente sin aviso. `fetchLatestBaileysVersion()` mitiga, pero igual conviene seguir el repo (`@whiskeysockets/baileys`) y actualizar mensualmente.
2. **Ban risk**: enviar a muchos números no agendados, mensajes idénticos en ráfaga, o desde IPs muy "datacenter-y" puede gatillar baneo del **número personal**. Mitigaciones:
   - Envío secuencial con delay (≥2 s).
   - Variar levemente el texto.
   - Usar un número dedicado, no el personal.
3. **`whatsapp_session` crece con el uso**. Las filas `keys:*` se rotan; Baileys borra las viejas al setear `null`. En cuentas activas se mantiene en cientos de filas, no miles.
4. **Concurrencia**: la sesión es **single-process**. No levantar dos instancias del backend apuntando al mismo `whatsapp_session` — pelean por las claves y la sesión se corrompe. Para escalar horizontalmente, usar leader-election (lock en Postgres) o un microservicio dedicado al WhatsApp con réplicas = 1.
5. **Memoria**: `makeCacheableSignalKeyStore` cachea claves en memoria. En cuentas grandes (>500 contactos activos) puede consumir 100–200 MB. Servidores con 256 MB de RAM (free tier de Render) pueden no alcanzar.
6. **Zona horaria**: `dayjs()` usa la TZ del proceso. En Render/Vercel suele ser UTC. Argentina = UTC-3, así que las 0:00 ART son las 03:00 UTC. Si el cron corre a la medianoche UTC, el "hoy" del dedupe puede dar un día distinto al esperado. Soluciones: setear `TZ=America/Argentina/Buenos_Aires` en el entorno, o usar `dayjs.tz('America/Argentina/Buenos_Aires')` explícito.
7. **Mensaje de inicio en cada redeploy**: si el server reinicia 10 veces al día, el admin recibe 10 "✅ Sesión abierta". Es la señal de monitoreo, pero molesta. Se puede gatear con un TTL en `whatsapp_session` (ej. fila `last-startup-ping` con timestamp, solo mandar si pasó >1 h).
8. **Sin tests automatizados**: el módulo no tiene tests. Para verificar manualmente sin spamear alumnos, usar `/api/simulate-whatsapp` (envía solo el resumen al admin).
9. **`.wwebjs_cache/`** que aparece en el repo es **basura** de una implementación previa con `whatsapp-web.js`. No se usa con Baileys. Se puede borrar y agregar a `.gitignore`.

---

## 13. Diagrama mental

```
┌─────────────────┐
│ Cron externo    │
│ (cron-job, GH)  │
└────────┬────────┘
         │ POST /api/trigger-whatsapp
         ▼
┌─────────────────────────────────────────────┐
│ Express (server.js)                         │
│   triggerRecordatorios()                    │
│     ├─ check whatsapp_session.ultima-...    │  ─┐
│     ├─ getAlumnosFromSheet()                │   │
│     │    └─ supabase.from('alumnos')        │   │ Supabase
│     ├─ filter vence en 4 días                │   │ (REST + jsonb)
│     ├─ for alumno of porVencer:             │   │
│     │    ├─ sock.sendMessage(jid, text) ────┤   │
│     │    └─ insert whatsapp_mensajes ───────┤   │
│     └─ upsert ultima-ejecucion ─────────────┘  ─┘
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Baileys (WebSocket)         │
│   makeWASocket({ auth: {    │
│     creds, keys: cacheable( │
│       supabaseKeyStore      │
│     )                       │
│   })                        │
└─────┬───────────────┬───────┘
      │ WSS           │ creds.update / keys.set
      ▼               ▼
┌──────────┐    ┌──────────────────┐
│ WhatsApp │    │ whatsapp_session │
│ servers  │    │ (Supabase)       │
└──────────┘    └──────────────────┘

Frontend:
  GET /api/dashboard/whatsapp-mensajes
   → WhatsappMessages.tsx → lista + dialog
```

---

## 14. Referencias

- Baileys (repo): https://github.com/WhiskeySockets/Baileys
- Docs Baileys: https://baileys.wiki/
- Supabase JS client: https://supabase.com/docs/reference/javascript
- Brevo transactional email API: https://developers.brevo.com/reference/sendtransacemail
- WhatsApp linked devices (cómo escanear QR): WhatsApp → Settings → Linked Devices
