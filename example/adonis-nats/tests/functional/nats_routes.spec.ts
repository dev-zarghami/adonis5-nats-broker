import { test } from '@japa/runner'
import Broker from '@ioc:Adonis/Addons/NatsBroker'

const auth = { authorization: 'Bearer test' }

test.group('NATS routes', () => {
  test('lists users (request/reply)', async ({ assert }) => {
    const res = await Broker.request('v1.get.users', {}, { headers: auth })
    assert.equal(res.headers.status, 200)
    assert.deepInclude(res.body[0], { id: 1, name: 'Jon' })
  })

  test('rejects a request without authorization (middleware)', async ({ assert }) => {
    const res = await Broker.request('v1.get.users')
    assert.equal(res.headers.status, 401)
  })

  test('resolves a route param', async ({ assert }) => {
    const res = await Broker.request('v1.get.users.1', {}, { headers: auth })
    assert.equal(res.headers.status, 200)
    assert.deepEqual(res.body, { id: 1, name: 'Jon' })
  })

  test('raises a custom exception for an unknown user (404)', async ({ assert }) => {
    const res = await Broker.request('v1.get.users.999', {}, { headers: auth })
    assert.equal(res.headers.status, 404)
    assert.equal(res.body.code, 'E_USER_NOT_FOUND')
  })

  test('validates the request body (422)', async ({ assert }) => {
    const res = await Broker.request('v1.post.users', {}, { headers: auth })
    assert.equal(res.headers.status, 422)
  })

  test('creates a user (201)', async ({ assert }) => {
    const res = await Broker.request('v1.post.users', { name: 'Alice' }, { headers: auth })
    assert.equal(res.headers.status, 201)
    assert.deepInclude(res.body, { message: 'User created' })
  })
})
