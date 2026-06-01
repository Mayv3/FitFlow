import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys'
import { supabaseAdmin } from '../../config/supabaseClient.js'

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
    console.warn(`[wa-auth ${gymId}] read ${id} error:`, error.message)
    return null
  }
  if (!data?.data?.value) return null
  try {
    return JSON.parse(data.data.value, BufferJSON.reviver)
  } catch (e) {
    console.warn(`[wa-auth ${gymId}] parse ${id} error:`, e.message)
    return null
  }
}

async function writeRow(gymId, id, value) {
  const payload = { value: JSON.stringify(value, BufferJSON.replacer) }
  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert({ gym_id: gymId, id, data: payload }, { onConflict: 'gym_id,id' })
  if (error) console.warn(`[wa-auth ${gymId}] write ${id} error:`, error.message)
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
    if (error) console.warn(`[wa-auth ${gymId}] writeMany error:`, error.message)
  }
}

async function deleteMany(gymId, ids) {
  for (const part of chunk(ids, 100)) {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('gym_id', gymId)
      .in('id', part)
    if (error) console.warn(`[wa-auth ${gymId}] deleteMany error:`, error.message)
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
    console.warn(`[wa-auth ${gymId}] readMany ${type} error:`, error.message)
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

export async function deleteSession(gymId) {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq('gym_id', gymId)
  if (error) throw error
}
