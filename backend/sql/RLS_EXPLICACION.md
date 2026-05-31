# RLS en FitFlow — explicado fácil 🧠

> Guía para entender **cómo cada gimnasio ve solo sus propios datos**, sin tecnicismos.

---

## 1. ¿Qué es el RLS? (en una frase)

**RLS = un portero adentro de la base de datos** que, en CADA consulta, filtra las filas y solo deja pasar las del gimnasio que pregunta.

Analogía: imaginá un edificio con muchos departamentos (gimnasios). Sin portero, cualquiera abre cualquier puerta. El RLS es el portero que dice:

> "¿Vos sos de HerGym? Entonces solo te muestro las cosas de HerGym. Lo de los otros gimnasios, ni lo ves."

RLS = **R**ow **L**evel **S**ecurity = "Seguridad a Nivel de Fila". Cada **fila** de una tabla sabe a qué gimnasio pertenece y el portero la filtra.

---

## 2. La idea central: `gym_id`

Casi todas las tablas (alumnos, pagos, asistencias, etc.) tienen una columna **`gym_id`**.
Es como una **etiqueta** que dice "esta fila es de tal gimnasio".

La regla es siempre la misma:

> **Solo podés ver / crear / editar / borrar filas donde `gym_id` = TU gimnasio.**

Nada más. Eso es todo el truco.

---

## 3. ¿Cómo sabe el portero de qué gimnasio sos?

Cuando hacés login, el sistema te da un **token** (una credencial digital, como una pulsera de boliche). Adentro de esa pulsera está escrito tu `gym_id`.

El portero lee tu pulsera con una función que se llama:

```
current_gym_id()   →  te devuelve TU gym_id
```

- Esa función lee el `gym_id` que viene **dentro del token** (en `app_metadata`).
- **Importante:** está guardado en una parte del token que **vos NO podés modificar** (solo el servidor la escribe). Así nadie se cambia la pulsera para colarse en otro gimnasio.

> Antes lo leía de otro lado que el usuario sí podía editar → inseguro. Ahora no.

---

## 4. Las 2 "puertas" para llegar a los datos

Hay dos formas de pedir datos, y el portero trata distinto a cada una:

### 🔑 Puerta A — El backend (servidor de FitFlow)
Usa una **llave maestra** (`service_role`). El portero lo conoce y lo deja pasar a todo **sin filtrar**.
👉 Por eso la app funciona igual que siempre. El backend ya filtra por su cuenta con `WHERE gym_id = ...`.

### 🚪 Puerta B — Acceso directo (el navegador, o alguien con la "anon key")
Acá **SÍ actúa el portero**. Solo te muestra lo de tu gimnasio.
👉 Esta es la puerta que el RLS protege. Antes estaba **abierta de par en par**.

**En criollo:** el RLS es una **red de seguridad** para la Puerta B. Tu app real entra por la Puerta A.

---

## 5. ¿Qué cambió? (antes vs ahora)

| | ANTES 😱 | AHORA ✅ |
|---|---|---|
| Puerta B (directa) | Abierta. Cualquiera con la clave pública podía leer y modificar datos de **TODOS** los gimnasios | Cerrada. Solo ves lo tuyo |
| Facturación / alumnos de otros gyms | Expuesto | Protegido |
| La app (Puerta A) | Funcionaba | Funciona igual |

---

## 6. Las reglas, tabla por tabla (simple)

| Tabla(s) | Qué podés hacer |
|---|---|
| alumnos, pagos, asistencias, deudas, egresos, planes, productos, servicios, clases, turnos, whatsapp... | **Todo (ver/crear/editar/borrar) pero SOLO de tu gimnasio** |
| `users` (usuarios del sistema) | Ves los de tu gym. Crear/editar/borrar usuarios: solo si sos **owner o administrador**, y siempre dentro de tu gym |
| `gyms` | Ves **solo la fila de tu propio gimnasio** |
| `suscriptions` | Ves tu suscripción (no la podés editar — eso lo maneja FitFlow) |
| `roles`, `metodos_de_pago`, `gym_plans` | Listas comunes a todos. Solo lectura |
| `novedades` (el blog del sistema) | **Todos pueden leer** (es público) |
| `gym_email_logs` (historial de mails) | **Solo el backend**. Nadie lo ve de forma directa |

---

## 7. Casos especiales (para que no te asustes)

- **Vistas materializadas** (`mv_dashboard_kpis`, etc.): son "fotos" con resúmenes (facturación, activos...). El RLS **no funciona** en ellas, así que les **cerramos el acceso directo**: solo las lee el backend.
- **"Alumno activo"**: NO hay un casillero "activo". Un alumno está activo si su **fecha de vencimiento es de hoy en adelante**. Vencido = inactivo.

---

## 8. ¿Y si algo se rompe? 🆘

Si después de un cambio la app deja de mostrar datos (tablas vacías):

1. **Lo más común:** tu sesión quedó vieja. **Cerrá sesión y volvé a entrar.** (Un token vencido cae como "anónimo" y el portero no lo deja ver nada.)
2. Si igual no anda, hay un **botón de pánico**: el archivo `rls_rollback.sql` **apaga todo el RLS** y la app vuelve a funcionar como antes (queda menos segura, pero funciona). Correlo en el SQL Editor de Supabase.

---

## 9. Reglas de oro 🥇

- ✅ El backend usa la **llave maestra** → no lo afecta el RLS.
- ✅ El navegador / accesos directos → **pasan por el portero** → solo ven su gym.
- ✅ La identidad sale del **token** (`gym_id` en `app_metadata`), que el usuario **no puede falsificar**.
- ⚠️ Si creás un usuario nuevo, el backend le pone el `gym_id` en el token automáticamente (por eso hay que tener el backend actualizado/deployado).
- ⚠️ Si una tabla nueva tiene datos por gimnasio, **acordate de ponerle RLS** con la misma regla (`gym_id = current_gym_id()`), si no queda abierta.

---

## 10. Archivos relacionados

| Archivo | Para qué |
|---|---|
| `rls_multitenant.sql` | Todo el RLS que está aplicado (el "qué") |
| `rls_rollback.sql` | Botón de pánico: apaga todo el RLS |
| `mv_revoke_api_access.sql` | Cierra el acceso directo a las vistas materializadas |
| `RLS_EXPLICACion.md` | Este documento |

---

**TL;DR:** Cada gimnasio tiene una etiqueta (`gym_id`). El RLS es un portero que, en cada consulta directa, solo deja ver/tocar las filas con TU etiqueta. Tu app entra con llave maestra y no se ve afectada. Si algo se ve vacío → **re-login**.
