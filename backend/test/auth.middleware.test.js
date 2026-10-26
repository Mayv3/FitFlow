import assert from 'node:assert/strict'
import test from 'node:test'
import { createVerifyToken } from '../middleware/auth.js'

function makeToken(exp = Math.floor(Date.now() / 1000) + 300) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ exp })}.signature`
}

function request(token) {
  return { headers: { authorization: `Bearer ${token}` } }
}

function response() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

test('verifies a token remotely once and reuses it during the short cache TTL', async () => {
  let calls = 0
  const user = { id: 'user-1', app_metadata: { gym_id: 'gym-1' } }
  const verifyToken = createVerifyToken({
    getUser: async () => {
      calls += 1
      return { data: { user }, error: null }
    },
  })
  const token = makeToken()

  for (let i = 0; i < 2; i += 1) {
    const req = request(token)
    let nextCalls = 0
    await verifyToken(req, response(), () => { nextCalls += 1 })
    assert.equal(nextCalls, 1)
    assert.equal(req.gymId, 'gym-1')
  }

  assert.equal(calls, 1)
})

test('deduplicates concurrent validations of the same token', async () => {
  let calls = 0
  const verifyToken = createVerifyToken({
    getUser: async () => {
      calls += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return { data: { user: { id: 'user-1', app_metadata: {} } }, error: null }
    },
  })
  const token = makeToken()

  await Promise.all(Array.from({ length: 8 }, async () => {
    await verifyToken(request(token), response(), () => {})
  }))

  assert.equal(calls, 1)
})

test('does not cache expired or invalid tokens', async () => {
  let calls = 0
  const verifyToken = createVerifyToken({
    getUser: async () => {
      calls += 1
      return { data: { user: null }, error: new Error('expired') }
    },
  })
  const token = makeToken(Math.floor(Date.now() / 1000) - 1)

  for (let i = 0; i < 2; i += 1) {
    const res = response()
    await verifyToken(request(token), res, () => assert.fail('next must not run'))
    assert.equal(res.statusCode, 403)
  }

  assert.equal(calls, 2)
})
