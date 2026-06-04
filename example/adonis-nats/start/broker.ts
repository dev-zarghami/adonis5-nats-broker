import Broker from '@ioc:Adonis/Addons/NatsBroker'
import Jet from '@ioc:Adonis/Addons/NatsJetStream'
import Event from '@ioc:Adonis/Core/Event'
import Logger from '@ioc:Adonis/Core/Logger'

/*
|--------------------------------------------------------------------------
| Core request/reply routes
|--------------------------------------------------------------------------
| Grouped under the `v1` prefix and guarded by the `auth` middleware, so they
| answer the subjects:
|   v1.get.users        v1.get.users.{id}        v1.post.users
|
| `post.users` adds `auth:web` per-route just to show the group + per-route
| middleware forms compose.
*/
Broker.group(() => {
  Broker.route('get.users', 'UsersController.index')
  Broker.route('get.users.{id}', 'UsersController.show')
  Broker.route('post.users', 'UsersController.store').middleware('auth:web')
})
  .prefix('v1')
  .middleware('auth')

/*
|--------------------------------------------------------------------------
| Fire-and-forget publish target
|--------------------------------------------------------------------------
| Receives messages sent with `Broker.publish('audit.log', ...)`. No reply.
*/
Broker.route('audit.log', 'AuditController.record')

/*
|--------------------------------------------------------------------------
| JetStream consumer
|--------------------------------------------------------------------------
| Requires `jetstream.enabled = true` in config/nats.ts and the stream to
| exist (run `node ace nats:sync`).
*/
Jet.consume(
  { stream: 'USERS', durable: 'users-worker', filterSubject: 'users.created' },
  'UsersController.onCreated'
)

/*
|--------------------------------------------------------------------------
| Connection lifecycle events
|--------------------------------------------------------------------------
*/
Event.on('nats:connect', ({ connection }) => {
  if (!(connection instanceof Error)) Logger.info(`[nats] connected to ${connection.getServer()}`)
})
Event.on('nats:reconnect', () => Logger.info('[nats] reconnected'))
Event.on('nats:disconnect', () => Logger.warn('[nats] disconnected'))
