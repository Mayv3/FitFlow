import assert from 'node:assert/strict'
import test from 'node:test'
import { getPermanencia } from '../services/stats.supabase.js'

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

test('pide la permanencia del gym con la fecha de hoy y devuelve lo que trae la base', async () => {
  const resumen = {
    total: 3,
    activos: 1,
    meses_promedio: 2.5,
    valor_promedio: 74720,
    tramos: [{ tramo: '0-1', activos: 1, se_fueron: 2 }],
  }
  const { client, llamadas } = fakeRpc({ data: resumen, error: null })

  const r = await getPermanencia({ gymId: 'g1', hoy: '2026-11-17' }, client)

  assert.deepEqual(r, resumen)
  assert.deepEqual(llamadas, [['stats_permanencia', { p_gym_id: 'g1', p_hoy: '2026-11-17' }]])
})

test('propaga el error de la base', async () => {
  const { client } = fakeRpc({ data: null, error: new Error('boom') })

  await assert.rejects(getPermanencia({ gymId: 'g1', hoy: '2026-11-17' }, client), /boom/)
})
