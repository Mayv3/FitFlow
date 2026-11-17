import assert from 'node:assert/strict'
import test from 'node:test'
import { getVentasExtras } from '../services/stats.supabase.js'

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

test('pide las ventas del año y del mes elegido', async () => {
  const datos = { meses: [], top_productos: [], top_servicios: [] }
  const { client, llamadas } = fakeRpc({ data: datos, error: null })

  const r = await getVentasExtras({ gymId: 'g1', year: 2026, month: 4 }, client)

  assert.deepEqual(r, datos)
  assert.deepEqual(llamadas, [['stats_ventas_extras', { p_gym_id: 'g1', p_year: 2026, p_month: 4 }]])
})

test('sin mes pide el año completo (p_month null)', async () => {
  const { client, llamadas } = fakeRpc({ data: { meses: [], top_productos: [], top_servicios: [] }, error: null })

  await getVentasExtras({ gymId: 'g1', year: 2026 }, client)

  assert.equal(llamadas[0][1].p_month, null)
})

test('propaga el error de la base', async () => {
  const { client } = fakeRpc({ data: null, error: new Error('boom') })

  await assert.rejects(getVentasExtras({ gymId: 'g1', year: 2026 }, client), /boom/)
})
