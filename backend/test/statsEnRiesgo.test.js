import assert from 'node:assert/strict'
import test from 'node:test'
import { getAlumnosEnRiesgo } from '../services/stats.supabase.js'

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

test('pide la función de alumnos en riesgo con el gym, los días y la fecha', async () => {
  const datos = { registra_asistencias: true, activos: 10, items: [{ id: 1, dias_sin_venir: 20 }] }
  const { client, llamadas } = fakeRpc({ data: datos, error: null })

  const r = await getAlumnosEnRiesgo({ gymId: 'g1', dias: 21, hoy: '2026-11-16' }, client)

  assert.deepEqual(r, datos)
  assert.deepEqual(llamadas, [['stats_en_riesgo', { p_gym_id: 'g1', p_dias: 21, p_hoy: '2026-11-16' }]])
})

test('usa 14 días y la fecha de hoy en Argentina por defecto', async () => {
  const { client, llamadas } = fakeRpc({ data: { registra_asistencias: true, activos: 0, items: [] }, error: null })

  await getAlumnosEnRiesgo({ gymId: 'g1' }, client)

  const args = llamadas[0][1]
  assert.equal(args.p_dias, 14)
  assert.match(args.p_hoy, /^\d{4}-\d{2}-\d{2}$/)
})

test('propaga el error de la base', async () => {
  const { client } = fakeRpc({ data: null, error: new Error('boom') })

  await assert.rejects(getAlumnosEnRiesgo({ gymId: 'g1' }, client), /boom/)
})
