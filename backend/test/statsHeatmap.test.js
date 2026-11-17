import assert from 'node:assert/strict'
import test from 'node:test'
import { getAsistenciasHeatmap } from '../services/stats.supabase.js'

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

test('con mes pide del primero al último día de ese mes', async () => {
  const filas = [{ dia: 3, hora: 19, total: 90 }]
  const { client, llamadas } = fakeRpc({ data: filas, error: null })

  const r = await getAsistenciasHeatmap({ gymId: 'g1', year: 2026, month: 2 }, client)

  assert.deepEqual(r, filas)
  assert.deepEqual(llamadas, [['stats_asistencias_heatmap', { p_gym_id: 'g1', p_desde: '2026-02-01', p_hasta: '2026-02-28' }]])
})

test('diciembre termina el 31 sin pasarse al año siguiente', async () => {
  const { client, llamadas } = fakeRpc({ data: [], error: null })

  await getAsistenciasHeatmap({ gymId: 'g1', year: 2026, month: 12 }, client)

  assert.equal(llamadas[0][1].p_desde, '2026-12-01')
  assert.equal(llamadas[0][1].p_hasta, '2026-12-31')
})

test('sin mes pide el año completo', async () => {
  const { client, llamadas } = fakeRpc({ data: [], error: null })

  await getAsistenciasHeatmap({ gymId: 'g1', year: 2026 }, client)

  assert.equal(llamadas[0][1].p_desde, '2026-01-01')
  assert.equal(llamadas[0][1].p_hasta, '2026-12-31')
})

test('propaga el error de la base', async () => {
  const { client } = fakeRpc({ data: null, error: new Error('boom') })

  await assert.rejects(getAsistenciasHeatmap({ gymId: 'g1', year: 2026 }, client), /boom/)
})
