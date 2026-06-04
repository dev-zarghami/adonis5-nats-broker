import { test } from '@japa/runner'
import Jet from '@ioc:Adonis/Addons/NatsJetStream'
import KV from '@ioc:Adonis/Addons/NatsKV'
import ObjectStore from '@ioc:Adonis/Addons/NatsObjectStore'

test.group('JetStream', () => {
  test('publishes to a stream and gets an ack', async ({ assert }) => {
    const ack = await Jet.publish('users.created', { id: 42, name: 'Zed' })
    assert.equal(ack.stream, 'USERS')
    assert.isAbove(ack.seq, 0)
  })
})

test.group('Key-Value store', () => {
  test('puts and gets a value', async ({ assert }) => {
    const bucket = await KV.bucket('sessions')
    await bucket.put('greeting', 'hello-kv')
    const entry = await bucket.get('greeting')
    assert.equal(entry?.string(), 'hello-kv')
  })
})

test.group('Object store', () => {
  test('round-trips a blob', async ({ assert }) => {
    await ObjectStore.putBlob('uploads', 'note.txt', 'hello-object')
    const bytes = await ObjectStore.getBlob('uploads', 'note.txt')
    assert.equal(Buffer.from(bytes!).toString(), 'hello-object')
  })

  test('returns null for a missing object', async ({ assert }) => {
    const bytes = await ObjectStore.getBlob('uploads', 'does-not-exist.txt')
    assert.isNull(bytes)
  })
})
