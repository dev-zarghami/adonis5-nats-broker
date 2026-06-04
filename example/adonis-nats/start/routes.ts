/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| These HTTP routes drive every feature of the broker from plain HTTP handlers,
| over the single shared connection: request/reply, fire-and-forget publish,
| JetStream publish, KV, and Object Store.
|
*/

import Route from '@ioc:Adonis/Core/Route'
import Broker from '@ioc:Adonis/Addons/NatsBroker'
import Jet from '@ioc:Adonis/Addons/NatsJetStream'
import KV from '@ioc:Adonis/Addons/NatsKV'
import ObjectStore from '@ioc:Adonis/Addons/NatsObjectStore'

const auth = { authorization: 'Bearer demo' }

Route.get('/', async () => {
  return { hello: 'world' }
})

/*
| Request/reply — round-trips over NATS to the v1.* routes (auth-guarded).
*/
Route.get('/users', async () => {
  const res = await Broker.request('v1.get.users', {}, { headers: auth })
  return res.body
})

Route.get('/users/:id', async ({ params, response }) => {
  // Broker.request always resolves; forward the NATS status to the HTTP response.
  const res = await Broker.request(`v1.get.users.${params.id}`, {}, { headers: auth })
  return response.status(res.headers.status).send(res.body)
})

Route.post('/users', async ({ request, response }) => {
  const res = await Broker.request('v1.post.users', request.body(), { headers: auth })
  return response.status(res.headers.status).send(res.body)
})

/*
| Fire-and-forget core publish — no reply.
*/
Route.post('/audit', async ({ request }) => {
  await Broker.publish('audit.log', request.body())
  return { published: true }
})

/*
| JetStream — persistent publish; the durable consumer logs the delivery.
*/
Route.post('/events/user-created', async ({ request }) => {
  const ack = await Jet.publish('users.created', request.body())
  return { published: true, seq: ack.seq, stream: ack.stream }
})

/*
| Key-Value store.
*/
Route.get('/kv/:key', async ({ params }) => {
  const sessions = await KV.bucket('sessions')
  await sessions.put(params.key, `visited at ${new Date().toISOString()}`)
  const entry = await sessions.get(params.key)
  return { key: params.key, value: entry?.string() }
})

/*
| Object Store — store and read a named blob.
*/
Route.put('/files/:name', async ({ params, request }) => {
  const info = await ObjectStore.putBlob('uploads', params.name, JSON.stringify(request.body()))
  return { stored: info.name, size: info.size }
})

Route.get('/files/:name', async ({ params, response }) => {
  const bytes = await ObjectStore.getBlob('uploads', params.name)
  if (!bytes) return response.notFound({ message: 'file not found' })
  return { name: params.name, content: Buffer.from(bytes).toString() }
})
