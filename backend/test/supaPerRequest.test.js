import assert from 'node:assert/strict'
import test from 'node:test'

process.env.SUPABASE_URL ??= 'https://abcdefghijklmnop.supabase.co'
process.env.SUPABASE_ANON_KEY ??= 'anon-key'

const { supaPerRequest } = await import('../middleware/supaPerRequest.js')

test('el cliente por request no deja un ticker de auto-refresh vivo (fuga de memoria)', async () => {
  const req = { headers: { authorization: 'Bearer token-de-prueba' } }
  let nextCalls = 0
  supaPerRequest(req, {}, () => { nextCalls += 1 })

  assert.equal(nextCalls, 1)
  await req.supa.auth.initializePromise
  assert.equal(req.supa.auth.autoRefreshToken, false)
  assert.equal(req.supa.auth.autoRefreshTicker, null)
})

test('las queries siguen saliendo con el token del usuario (para RLS)', async (t) => {
  const llamadas = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    llamadas.push({ url: String(url), headers: new Headers(init?.headers) })
    return new Response('[{"dni":"123"}]', { status: 200, headers: { 'content-type': 'application/json' } })
  })

  const req = { headers: { authorization: 'Bearer jwt-del-usuario' } }
  supaPerRequest(req, {}, () => {})
  const { data, error } = await req.supa.from('alumnos').select('dni')

  assert.equal(error, null)
  assert.deepEqual(data, [{ dni: '123' }])
  assert.equal(llamadas.length, 1)
  assert.match(llamadas[0].url, /\/rest\/v1\/alumnos\?select=dni/)
  assert.equal(llamadas[0].headers.get('authorization'), 'Bearer jwt-del-usuario')
})
