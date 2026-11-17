import assert from 'node:assert/strict'
import test from 'node:test'
import { getRenovacionPorMes } from '../services/stats.supabase.js'

function fakeRpc(respuesta) {
  const llamadas = []
  return {
    llamadas,
    client: {
      rpc(nombre, args) {
        llamadas.push([nombre, args])
        return Promise.resolve(respuesta)
      },
    },
  }
}

test('pide la función de renovación con el gym, el año y la fecha', async () => {
  const filas = [{ mes: 1, vencieron: 10, renovaron: 7, abandonaron: 3, pendientes: 0 }]
  const { client, llamadas } = fakeRpc({ data: filas, error: null })

  const r = await getRenovacionPorMes({ gymId: 'g1', year: 2026, hoy: '2026-11-16' }, client)

  assert.deepEqual(r, filas)
  assert.deepEqual(llamadas, [['stats_renovacion', { p_gym_id: 'g1', p_year: 2026, p_hoy: '2026-11-16' }]])
})

test('usa la fecha de hoy en Argentina por defecto', async () => {
  const { client, llamadas } = fakeRpc({ data: [], error: null })

  await getRenovacionPorMes({ gymId: 'g1', year: 2026 }, client)

  assert.match(llamadas[0][1].p_hoy, /^\d{4}-\d{2}-\d{2}$/)
})

test('propaga el error de la base', async () => {
  const { client } = fakeRpc({ data: null, error: new Error('boom') })

  await assert.rejects(getRenovacionPorMes({ gymId: 'g1', year: 2026 }, client), /boom/)
})
