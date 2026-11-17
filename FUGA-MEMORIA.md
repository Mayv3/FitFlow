# Fuga de memoria → OOM del backend en Render

**Estado: diagnosticado y medido. Los fixes NO están aplicados todavía.**
Investigado el 2026-11-10 a partir de un crash en producción.

---

## Resumen en una línea

`supaPerRequest` crea un cliente de Supabase en cada request HTTP y **ninguno se
libera nunca**, porque el `setInterval` de auto-refresh del módulo de auth lo
retiene para siempre. A las ~16.000 requests el heap se llena y el proceso muere.

Todo lo demás que se ve en el log del crash — las desconexiones de WhatsApp, los
`fetch failed` a Supabase, el login roto — es **consecuencia**, no causa.

---

## 1. La causa raíz

### El código que filtra

`backend/middleware/supaPerRequest.js`:

```js
export function supaPerRequest(req, _res, next) {
  req.supa = createClient(...)   // uno nuevo en CADA request
  next()
}
```

Está montado en prácticamente todas las rutas: `/api/alumnos`, `/api/pagos`,
`/api/planes`, `/api/stats`, `/api/turnos`, `/api/clases`, `/api/novedades`,
`/api/productos`, `/api/sesiones`, `/api/suscriptions`, `/api/servicios`,
`/api/asistencias`, `/api/gym-plans`.

### Por qué el cliente no se puede recolectar

Cadena dentro de `@supabase/supabase-js` 2.50.2 / `@supabase/auth-js` 2.70.0:

1. `createClient()` → `new SupabaseClient` → `new GoTrueClient`
2. El constructor de `GoTrueClient` termina llamando a `this.initialize()`
   — `node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:134`
3. Eso llega a `_handleVisibilityChange()`, que en Node (entorno no-browser) hace
   — `GoTrueClient.js:1867`:

   ```js
   if (!isBrowser() || !window?.addEventListener) {
       if (this.autoRefreshToken) {
           // in non-browser environments the refresh token ticker runs always
           this.startAutoRefresh();
       }
       return false;
   }
   ```

4. `_startAutoRefresh()` monta un ticker — `GoTrueClient.js:1739`:

   ```js
   const ticker = setInterval(() => this._autoRefreshTokenTick(), AUTO_REFRESH_TICK_DURATION_MS);
   ```

`autoRefreshToken: true` es el **default**. El `setInterval` está `.unref()`-eado
(`GoTrueClient.js:1748`), así que no impide que el proceso termine — pero **sigue
siendo un timer registrado** y su closure referencia `this`.

Eso retiene: `GoTrueClient` → `SupabaseClient` → `PostgrestClient`,
`RealtimeClient`, `StorageClient`, `FunctionsClient`, `memoryStorage` y el header
`Authorization` con el JWT de ese usuario. Para siempre. Nadie llama nunca a
`stopAutoRefresh()`.

### Agravante: el middleware está montado dos veces en tres rutas

Esas requests filtran **dos** clientes cada una:

| Ruta | Primer montaje | Segundo montaje |
|---|---|---|
| `/api/alumnos` | `backend/server.js:74` | `backend/routes/members.routes.js:19-26` |
| `/api/pagos` | `backend/server.js:75` | `backend/routes/payments.routes.js:18` |
| `/api/planes` | `backend/server.js:76` | `backend/routes/planes.routes.js:10` |

---

## 2. Evidencia medida

Script corrido contra el `node_modules` del proyecto, creando 2000 clientes y
forzando GC dos veces:

```
como esta hoy            retenido tras GC:   14.3 MB =   7.3 KB/cliente
con auth desactivado     retenido tras GC:   -0.0 MB =  -0.0 KB/cliente
```

**7,3 KB por cliente que sobreviven a dos `global.gc()` seguidos.** Con el auth
desactivado: cero, se recolectan todos.

Con 20.000 clientes filtrados el heap mide 148 MB.

### La cuenta

El log del crash muestra el techo de heap en Render:

```
[85:0x2bfc7000] 560655889 ms: Mark-Compact 243.9 (258.9) -> 242.7 (259.1) MB ...
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

Techo ≈ **256 MB** (Node se autolimita así en instancias de 512 MB).
A 7,3 KB por cliente → **~16.000 requests hasta el OOM**.
El uptime del crash fue `560652098 ms` = **6,5 días** → 1,7 requests/minuto.
Nada: cualquier uso normal del panel llega ahí.

### Scripts para reproducir la medición

`leaktest.cjs` (correr con `node --expose-gc leaktest.cjs`):

```js
const { createClient } = require('./backend/node_modules/@supabase/supabase-js/dist/main/index.js')

const URL_ = 'https://abcdefghijklmnop.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.fake'
const N = 2000

const mb = () => process.memoryUsage().heapUsed / 1048576

async function run(label, opts) {
  global.gc(); global.gc()
  const before = mb()
  for (let i = 0; i < N; i++) {
    createClient(URL_, KEY, { global: { headers: { Authorization: 'Bearer t' + i } }, ...opts })
  }
  await new Promise(r => setTimeout(r, 300))
  global.gc(); global.gc()
  const d = mb() - before
  console.log(`${label.padEnd(24)} retenido tras GC: ${d.toFixed(1).padStart(6)} MB = ${(d*1024/N).toFixed(1).padStart(5)} KB/cliente`)
}

;(async () => {
  await run('como esta hoy', {})
  await run('con auth desactivado', { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
})()
```

---

## 3. Por qué eso explica todo el log del crash

El OOM es la causa; el resto del log es el servidor asfixiado:

```
heap lleno
  → Mark-Compact de 2906 ms y 3787 ms que no liberan nada (243.7 → 242.8 MB)
  → current mu = 0.001  (el 99,9% del tiempo es GC, 0,1% para el programa)
  → el event loop queda congelado
      → Baileys no manda el keepalive  → WhatsApp cierra con 408 (connectionLost/timedOut)
      → WhatsApp cierra el socket       → 428 (connectionClosed)
      → los fetch a Supabase vencen     → "TypeError: fetch failed"
      → el login falla                  → "No se pudo obtener el perfil del usuario"
      → no se pueden guardar las claves → "No pude guardar un lote de 1 claves de sesión"
```

### Prueba independiente: los timers llegaban tardísimo

Los `setTimeout` del backoff de reconexión tardaban 20-45 s en disparar un
timer de 3 s. Eso no es red, es el event loop bloqueado:

| Reintento programado | Debería abrir | Abrió realmente | Retraso |
|---|---|---|---|
| 18:38:40 en 3s | 18:38:43 | 18:38:59 | +16s |
| 18:39:53 en 3s | 18:39:56 | 18:40:41 | +45s |
| 18:43:41 en 6s | 18:43:47 | 18:44:25 | +38s |
| 18:45:18 en 12s | 18:45:30 | 18:45:49 | +19s |

### Lo que NO es el problema

`backend/services/whatsapp/WhatsappManager.js` está bien hecho y **no es el
culpable**: hace `removeAllListeners()` + `end()` en todos los caminos de cierre,
tiene guard contra doble `connect()`, cancela timers, y maneja 401/403/440 por
separado. El loop de reconexión es la víctima, no la causa.

Medido aparte: los ticks de auto-refresh de 20.000 clientes filtrados **no**
trababan el event loop por sí mismos (lag medio 15,5 ms, p99 17 ms). El freeze
viene del GC, no de los ticks. La fuga mata por memoria, no por CPU.

---

## 4. FIX 1 — el importante (arregla el OOM)

`backend/middleware/supaPerRequest.js`, reemplazar el archivo completo:

```js
import { createClient } from '@supabase/supabase-js'

// req.supa solo se usa para queries con el JWT del usuario (RLS). No se llama
// nunca a .auth, .realtime ni .channel sobre él, así que toda la maquinaria de
// sesión es de más — y su setInterval de auto-refresh retiene el cliente entero
// para siempre, filtrando uno por request hasta que el heap de Render explota.
// Ver FUGA-MEMORIA.md.
const SIN_SESION = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
}

export function supaPerRequest(req, _res, next) {
  // Tres rutas tienen el middleware montado dos veces (server.js + el router):
  // sin este guard crean dos clientes por request.
  if (req.supa) return next()
  req.supa = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: req.headers.authorization ?? '' } },
      auth: SIN_SESION,
    }
  )
  next()
}
```

### Por qué es seguro

Verificado con grep en todo `backend/`: **no hay ni un uso** de `req.supa.auth.*`,
`.realtime` ni `.channel`. El JWT viaja en el header `Authorization`, que es lo
que PostgREST usa para resolver RLS — eso no se toca.

**No tocar `backend/config/supabaseClient.js`**: `supabaseAdmin` y `supabase` son
singletons de módulo (2 timers en todo el proceso, no hay fuga), y `supabaseAdmin.auth.getUser()`
sí se usa (en `server.js` y en el middleware de auth). Cambiarlos no gana nada y
puede romper el login.

---

## 5. FIX 2 — un `NodeCache` filtrado por cada reconexión de WhatsApp

Mismo patrón de bug, mucho más chico. En
`backend/services/whatsapp/WhatsappManager.js`, dentro de `_connect()`:

```js
keys: makeCacheableSignalKeyStore(state.keys, logger)   // sin 3er argumento
```

Sin el tercer parámetro, Baileys crea un `NodeCache` nuevo en cada llamada
(`node_modules/@whiskeysockets/baileys/lib/Utils/auth-utils.js:19`), y ese cache
tiene su propio `setInterval` de `checkperiod` (600 s) que lo retiene igual que el
caso de Supabase. Son pocos KB cada uno, pero crece sin tope con la cantidad de
reconexiones — y en este log hay una reconexión cada 1-2 minutos.

**Fix:** un cache por gym, reusado entre reconexiones.

```js
import NodeCache from '@cacheable/node-cache'

// En el constructor de WhatsappManager:
this.keyCaches = new Map() // gymId -> NodeCache (reusado entre reconexiones)

// Helper:
_keyCache(gymId) {
  let c = this.keyCaches.get(gymId)
  if (!c) {
    c = new NodeCache({ stdTTL: 300, useClones: false, deleteOnExpire: true })
    this.keyCaches.set(gymId, c)
  }
  return c
}

// En _connect(), al armar el socket:
keys: makeCacheableSignalKeyStore(state.keys, logger, this._keyCache(gymId))
```

Y en `disconnect()`, soltarlo:

```js
const cache = this.keyCaches.get(gymId)
if (cache) { try { cache.close() } catch {} ; this.keyCaches.delete(gymId) }
```

> Nota: `@cacheable/node-cache` ya está instalado como dependencia transitiva de
> Baileys. Conviene agregarlo explícito a `backend/package.json` si se va a
> importar directo.

---

## 6. FIX 3 — `fetchLatestBaileysVersion()` en cada reconexión

En `_connect()`:

```js
const { version } = await fetchLatestBaileysVersion()
```

Es un fetch a la red en **cada** reintento del backoff. Justo cuando la red está
mal — que es cuando se reconecta — es un punto de falla extra y gratis, y suma
latencia a cada reintento.

**Fix:** cachearlo unas horas a nivel de módulo, con fallback a la última versión
conocida si el fetch falla.

```js
let versionCache = { version: null, at: 0 }
const VERSION_TTL_MS = 6 * 60 * 60 * 1000

async function getBaileysVersion() {
  if (versionCache.version && Date.now() - versionCache.at < VERSION_TTL_MS) {
    return versionCache.version
  }
  try {
    const { version } = await fetchLatestBaileysVersion()
    versionCache = { version, at: Date.now() }
    return version
  } catch (e) {
    if (versionCache.version) return versionCache.version // seguir con la vieja
    throw e
  }
}
```

---

## 7. FIX 4 — sockets de socket.io que quedan abiertos

`backend/server.js:119`: cuando la auth del socket falla, el handler hace
`return` sin cerrar la conexión (`return` en las líneas 122 y 125).

```js
io.on('connection', async (socket) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return                      // ← socket queda vivo
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return               // ← socket queda vivo
    ...
```

Esas conexiones sin autenticar quedan abiertas indefinidamente.

**Fix:** reemplazar cada `return` por `return socket.disconnect(true)`.

---

## 8. Configuración de Render

El log muestra el techo de heap en ~256 MB, que es el default de Node en una
instancia de 512 MB. Subirlo da margen, pero **sin el FIX 1 solo corre el crash
unos días más adelante** — no es un arreglo.

No hay `render.yaml` ni `Procfile` en el repo, así que el start command está en el
dashboard de Render. Si se quiere subir el límite, cambiarlo ahí a:

```
node --max-old-space-size=400 server.js
```

---

## 9. Test de regresión a agregar

`backend/test/supaPerRequest.test.js` (nuevo):

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { supaPerRequest } from '../middleware/supaPerRequest.js'

const N = 2000
const MAX_RETENIDO_MB = 3   // hoy retiene ~15 MB; con el fix, ~0

test('no retiene los clientes de Supabase que crea por request', async (t) => {
  if (typeof global.gc !== 'function') {
    t.skip('correr con --expose-gc')
    return
  }
  process.env.SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.fake'

  const mb = () => process.memoryUsage().heapUsed / 1048576
  global.gc(); global.gc()
  const antes = mb()

  for (let i = 0; i < N; i++) {
    const req = { headers: { authorization: `Bearer token-${i}` } }
    supaPerRequest(req, {}, () => {})
  }

  await new Promise((r) => setTimeout(r, 300))
  global.gc(); global.gc()
  const retenido = mb() - antes

  assert.ok(
    retenido < MAX_RETENIDO_MB,
    `${N} requests retuvieron ${retenido.toFixed(1)} MB tras GC (máximo ${MAX_RETENIDO_MB} MB). ` +
    `Alguien volvió a dejar el auto-refresh del auth prendido en supaPerRequest.`
  )
})

test('no crea un segundo cliente si el middleware ya corrió', () => {
  const req = { headers: { authorization: 'Bearer x' }, supa: { marca: 'original' } }
  supaPerRequest(req, {}, () => {})
  assert.equal(req.supa.marca, 'original')
})
```

Y en `backend/package.json`, agregar el script:

```json
"test": "node --test --expose-gc test/"
```

---

## 10. Orden de aplicación y verificación

1. [ ] Aplicar FIX 1 (`supaPerRequest.js`) — **esto solo ya resuelve el OOM**
2. [ ] Agregar el test de regresión y el script `test` en `package.json`
3. [ ] Correr `npm test` desde `backend/` → tiene que pasar
       (si se corre *antes* del FIX 1, tiene que fallar: eso confirma que el test sirve)
4. [ ] Aplicar FIX 2, 3 y 4
5. [ ] Correr `npm test` otra vez
6. [ ] Deploy y mirar la memoria en el dashboard de Render durante un día:
       antes subía monótonamente hasta ~250 MB; ahora tiene que quedarse plana
7. [ ] Confirmar que desaparecen los 408/428 en loop de WhatsApp

### Monitoreo para confirmar en producción

Loguear la curva de heap y mirarla en Render:

```js
// en server.js, dentro del server.listen(...)
setInterval(() => {
  const mb = (process.memoryUsage().heapUsed / 1048576).toFixed(0)
  console.log(`[mem] heap ${mb} MB`)
}, 5 * 60 * 1000).unref()
```

Si después del fix la curva sube y baja (sierra) en vez de subir siempre, está
resuelto.
