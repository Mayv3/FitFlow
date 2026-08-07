import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys'
import { supabaseAdmin } from '../../config/supabaseClient.js'
import { waLog } from './logger.js'

const TABLE = 'whatsapp_session'

function rowId(type, id) {
  return `keys:${type}:${id}`
}

async function readRow(gymId, id) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('data')
    .eq('gym_id', gymId)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    waLog(gymId, `No pude leer "${id}" de la sesión guardada`, {
      level: 'warn',
      detalle: { Error: error.message, 'Qué implica': 'Se arranca con credenciales nuevas y va a pedir QR.' }
    })
    return null
  }
  if (!data?.data?.value) return null
  try {
    return JSON.parse(data.data.value, BufferJSON.reviver)
  } catch (e) {
    waLog(gymId, `La fila "${id}" de la sesión está corrupta`, {
      level: 'error',
      detalle: { Error: e.message, 'Qué implica': 'Se ignora esa fila; si es "creds", va a pedir QR.' }
    })
    return null
  }
}

async function writeRow(gymId, id, value) {
  const payload = { value: JSON.stringify(value, BufferJSON.replacer) }
  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert({ gym_id: gymId, id, data: payload }, { onConflict: 'gym_id,id' })
  if (error) {
    waLog(gymId, `No pude guardar "${id}" en la sesión`, {
      level: 'error',
      detalle: {
        Error: error.message,
        'Qué implica': id === 'creds'
          ? 'Si el server se reinicia, la sesión se pierde y hay que re-escanear el QR.'
          : 'Pueden fallar mensajes cifrados con esa clave.'
      }
    })
  }
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Bulk upsert en chunks SECUENCIALES. Al escanear el QR, Baileys setea ~800
// pre-keys de una sola vez; un fetch por clave (Promise.all) abre cientos de
// conexiones concurrentes a Supabase y satura la red en el free tier
// (TypeError: fetch failed → handshake no termina → cierre 408 en loop).
// Un upsert por lote convierte esa ráfaga en pocas requests.
async function writeMany(gymId, rows) {
  for (const part of chunk(rows, 200)) {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .upsert(part, { onConflict: 'gym_id,id' })
    if (error) {
      waLog(gymId, `No pude guardar un lote de ${part.length} claves de sesión`, {
        level: 'error',
        detalle: { Error: error.message, 'Qué implica': 'Puede fallar el cifrado de mensajes con esos contactos.' }
      })
    }
  }
}

async function deleteMany(gymId, ids) {
  for (const part of chunk(ids, 100)) {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('gym_id', gymId)
      .in('id', part)
    if (error) {
      waLog(gymId, `No pude borrar un lote de ${part.length} claves viejas de sesión`, {
        level: 'warn',
        detalle: { Error: error.message, 'Qué implica': 'Solo deja filas de más en la tabla.' }
      })
    }
  }
}

async function readManyKeys(gymId, type, ids) {
  const fullIds = ids.map((i) => rowId(type, i))
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('id,data')
    .eq('gym_id', gymId)
    .in('id', fullIds)
  if (error) {
    waLog(gymId, `No pude leer ${ids.length} claves de tipo "${type}"`, {
      level: 'warn',
      detalle: { Error: error.message }
    })
    return {}
  }
  const out = {}
  for (const row of data || []) {
    const id = row.id.replace(`keys:${type}:`, '')
    try {
      let value = JSON.parse(row.data.value, BufferJSON.reviver)
      if (type === 'app-state-sync-key' && value) {
        value = proto.Message.AppStateSyncKeyData.fromObject(value)
      }
      out[id] = value
    } catch (e) {
      // skip corrupted
    }
  }
  return out
}

export async function useSupabaseAuthState(gymId) {
  if (!gymId) throw new Error('useSupabaseAuthState: gymId required')

  let creds = (await readRow(gymId, 'creds')) || initAuthCreds()

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => readManyKeys(gymId, type, ids),
        set: async (data) => {
          const toUpsert = []
          const toDelete = []
          for (const type of Object.keys(data)) {
            for (const id of Object.keys(data[type])) {
              const value = data[type][id]
              const full = rowId(type, id)
              if (value) {
                toUpsert.push({
                  gym_id: gymId,
                  id: full,
                  data: { value: JSON.stringify(value, BufferJSON.replacer) }
                })
              } else {
                toDelete.push(full)
              }
            }
          }
          await Promise.all([
            toUpsert.length ? writeMany(gymId, toUpsert) : Promise.resolve(),
            toDelete.length ? deleteMany(gymId, toDelete) : Promise.resolve()
          ])
        }
      }
    },
    saveCreds: () => writeRow(gymId, 'creds', creds)
  }
}

// Borrar una sesión es destructivo: solo motivos donde la sesión ya está muerta
// del lado de WhatsApp. Los errores de conexión ambiguos (408, 428, 440) NUNCA
// deben llegar acá — reconectan con las mismas creds, que siguen siendo válidas.
//   manual_disconnect: el usuario apretó Desvincular.
//   logged_out: 401. WhatsApp dice que el dispositivo ya no está registrado;
//     las creds no sirven más y conservarlas deja al gym sin poder re-vincular.
const DELETE_REASONS = new Set(['manual_disconnect', 'logged_out'])

export async function deleteSession(gymId, { reason } = {}) {
  if (!DELETE_REASONS.has(reason)) {
    throw new Error(`Refusing to delete WhatsApp session: invalid reason "${reason}"`)
  }
  const { error, count } = await supabaseAdmin
    .from(TABLE)
    .delete({ count: 'exact' })
    .eq('gym_id', gymId)
  if (error) throw error
  waLog(gymId, 'Sesión de WhatsApp borrada de la base', {
    level: 'warn',
    detalle: {
      Motivo: reason,
      'Filas borradas': count ?? '?',
      'Qué hacer': 'Escanear un QR nuevo desde el panel del gym para volver a enviar.'
    }
  })
}
