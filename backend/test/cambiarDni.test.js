import assert from 'node:assert/strict'
import test from 'node:test'
import { cambiarDniAlumno, DniEnUsoError } from '../services/alumnos.supabase.js'

// Cliente falso de Supabase: cada `from()` arma una query encadenable que
// registra los filtros y resuelve con la respuesta siguiente de `respuestas`.
function fakeSupa(respuestas) {
  const queries = []
  const client = {
    from(tabla) {
      const q = { tabla, ops: [] }
      queries.push(q)
      const builder = {
        then(resolve, reject) {
          return Promise.resolve(respuestas.shift() ?? { data: null, error: null }).then(resolve, reject)
        },
      }
      for (const op of ['select', 'update', 'eq', 'is', 'maybeSingle']) {
        builder[op] = (...args) => { q.ops.push([op, ...args]); return builder }
      }
      return builder
    },
  }
  return { client, queries }
}

test('cambia el DNI cuando el nuevo no está usado en el gym', async () => {
  const { client, queries } = fakeSupa([
    { data: null, error: null },
    { data: { id: 7, dni: '87654321', gym_id: 'g1' }, error: null },
  ])

  const r = await cambiarDniAlumno('12345678', '87654321', 'g1', client)

  assert.deepEqual(r, { id: 7, dni: '87654321', gym_id: 'g1' })
  // El chequeo busca el DNI nuevo dentro del gym, sin filtrar borrados.
  assert.deepEqual(queries[0].ops.filter(o => o[0] === 'eq'), [['eq', 'gym_id', 'g1'], ['eq', 'dni', '87654321']])
  assert.ok(!queries[0].ops.some(o => o[0] === 'is'))
  // El update apunta al alumno activo con el DNI actual.
  assert.deepEqual(queries[1].ops[0], ['update', { dni: '87654321' }])
  assert.ok(queries[1].ops.some(o => o[0] === 'eq' && o[1] === 'dni' && o[2] === '12345678'))
  assert.ok(queries[1].ops.some(o => o[0] === 'is' && o[1] === 'deleted_at' && o[2] === null))
})

test('rechaza un DNI que ya tiene otro alumno activo del gym', async () => {
  const { client, queries } = fakeSupa([{ data: { id: 9, deleted_at: null }, error: null }])

  await assert.rejects(
    cambiarDniAlumno('12345678', '87654321', 'g1', client),
    (e) => e instanceof DniEnUsoError && /otro alumno/.test(e.message),
  )
  assert.equal(queries.length, 1) // no llega a hacer el update
})

test('rechaza un DNI que pertenece a un alumno eliminado del gym', async () => {
  const { client } = fakeSupa([{ data: { id: 9, deleted_at: '2026-01-01' }, error: null }])

  await assert.rejects(
    cambiarDniAlumno('12345678', '87654321', 'g1', client),
    (e) => e instanceof DniEnUsoError && /eliminado/.test(e.message),
  )
})

test('traduce la violación de unique (carrera entre chequeo y update) a DniEnUsoError', async () => {
  const { client } = fakeSupa([
    { data: null, error: null },
    { data: null, error: { code: '23505', message: 'duplicate key' } },
  ])

  await assert.rejects(cambiarDniAlumno('12345678', '87654321', 'g1', client), DniEnUsoError)
})

test('devuelve null si no existe un alumno activo con el DNI actual', async () => {
  const { client } = fakeSupa([{ data: null, error: null }, { data: null, error: null }])

  assert.equal(await cambiarDniAlumno('12345678', '87654321', 'g1', client), null)
})
