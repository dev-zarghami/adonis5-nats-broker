# adonis5-nats-broker

[![npm version](https://img.shields.io/npm/v/adonis5-nats-broker.svg)](https://www.npmjs.com/package/adonis5-nats-broker)
[![license](https://img.shields.io/npm/l/adonis5-nats-broker.svg)](LICENSE.md)

> NATS for AdonisJS v5 — request/reply, JetStream, KV, and Object Store, all in the controller / middleware / request-response model you already know.

`adonis5-nats-broker` lets an AdonisJS service expose NATS subjects as **routes** handled by **controllers**, call other services with `request` / `publish`, consume **JetStream** streams in that same controller style, and use injected **KV** and **Object Store** managers — reusing AdonisJS's middleware, validator, exception handler, and logger throughout.

If you can build an HTTP API in AdonisJS, you already know how to use this.

```typescript
// start/broker.ts                          app/Controllers/Nats/UsersController.ts
Broker.route('get.users', 'UsersController.index')
                                            export default class UsersController {
// elsewhere — call it like fetch():          public async index({ response }) {
const res = await Broker.request('get.users') //   return response.ok([{ id: 1 }])
res.body // => [{ id: 1 }]                       }
                                            }
```

### How it maps to HTTP

| AdonisJS HTTP | adonis5-nats-broker |
| --- | --- |
| URL + method (`GET /users/:id`) | NATS subject (`get.users.{id}`) |
| Route param `:id` | Subject token `{id}` |
| Controller in `app/Controllers` | Controller in `app/Controllers/Nats` |
| Middleware in `app/Middleware` | Middleware in `app/Middleware/Nats` |
| `ctx.request` / `ctx.response` | the same API |
| HTTP status code | a `status` header on the reply |
| calling another service (`fetch`) | `Broker.request()` / `Broker.publish()` / `Jet.publish()` |

### Features

- **Core NATS** — request/reply routes, fire-and-forget publish, route groups, middleware.
- **JetStream** — persistent publish with acks, and consumers in the controller style with `ack` / `nak` / `term` / `working`.
- **KV** & **Object Store** — injected managers, usable from anywhere (including HTTP handlers).
- **Declarative resources** — describe streams, consumers, and buckets in config; reconcile with one idempotent command.
- **One shared connection** — reused across requests, publishes, JetStream, KV, and Object Store.
- Built on the modular **nats.js v3** (`@nats-io/*`). Requires AdonisJS v5 and Node.js 18+.

## Table of contents

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Routes & controllers](#routes--controllers)
  - [Controllers](#controllers)
  - [Route groups](#route-groups)
  - [Requesting & publishing](#requesting--publishing)
  - [Request & response](#request--response)
- [Middleware](#middleware)
- [Exception handling](#exception-handling)
- [JetStream](#jetstream)
- [Key-Value store](#key-value-store)
- [Object store](#object-store)
- [Connection events](#connection-events)
- [Testing](#testing)
- [Ace commands](#ace-commands)
- [Migrating from v1](#migrating-from-v1)

## Quick start

**1. Install & configure**

```bash
npm i adonis5-nats-broker
node ace configure adonis5-nats-broker   # writes config/nats.ts + start/broker.ts, wires the provider
node ace init:nats:handler               # creates app/Exceptions/Nats/Handler.ts
```

**2. Run a NATS server** (the `-js` flag enables JetStream / KV / Object Store)

```yaml
# docker-compose.yaml
services:
  nats:
    image: 'nats'
    command: '-js'
    ports:
      - '4222:4222'
```

```bash
docker compose up nats
```

**3. Define a route and a controller**

```typescript
// start/broker.ts
import Broker from '@ioc:Adonis/Addons/NatsBroker'

Broker.route('get.users', 'UsersController.index')
```

```bash
node ace make:nats:controller User
```

```typescript
// app/Controllers/Nats/UsersController.ts
import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

export default class UsersController {
  public async index({ response }: NatsContextContract) {
    return response.ok([{ id: 1, name: 'Jon' }])
  }
}
```

**4. Call it** — from an HTTP controller, a test, or another service:

```typescript
import Broker from '@ioc:Adonis/Addons/NatsBroker'

const res = await Broker.request('get.users')
res.body // => [{ id: 1, name: 'Jon' }]
```

That's the whole loop. Everything below builds on it.

## Configuration

`configure` writes `config/nats.ts`. The full shape:

```typescript
import Env from '@ioc:Adonis/Core/Env'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'

const config: ConfigContract = {
  // Process entrypoints that open the connection and start consuming on boot.
  runModes: ['test.ts', 'server.js', 'server.ts'],
  ignoreMiddlewares: ['BodyParserMiddleware'],
  generateRequestId: true,

  // The single shared connection, reused everywhere.
  connection: {
    name: Env.get('NATS_NAME'),
    servers: Env.get('NATS_SERVER'),
    maxReconnectAttempts: 10,
    reconnect: true,
    timeout: 30000,
  },

  namespaces: {
    controllers: 'app/Controllers/Nats',
    middleware: 'app/Middleware/Nats',
    exceptions: 'app/Exceptions/Nats',
    exceptionHandler: 'app/Exceptions/Nats/Handler',
    listeners: 'app/Controllers/Nats',
  },

  // Core (non-JetStream) request/reply + publish behaviour.
  core: {
    routes: { options: {}, prefix: '' },
    request: { timeout: 30000, prefix: '', headers: {}, qs: {} },
    publish: { prefix: '', headers: {}, qs: {} },
  },

  // JetStream / KV / Object Store — see their sections below.
  jetstream: { enabled: false, streams: [], consumers: [] },
  kv: { buckets: [] },
  objectStore: { buckets: [] },
}

export default config
```

**Run modes & the lazy connection.** Only processes whose entrypoint is listed in `runModes` (the server, tests) open the connection on boot and start *consuming* routes and JetStream messages. Any other process — an HTTP server, an ace command — connects **lazily** the first time it uses the broker, JetStream, KV, or Object Store. That means you can publish, request, or read a KV bucket straight from an HTTP controller without running the NATS consumer side there.

## Routes & controllers

Register routes in `start/broker.ts`. A pattern like `get.users.{id}` subscribes to the subject `get.users.*`, and `{id}` becomes a route param.

```typescript
import Broker from '@ioc:Adonis/Addons/NatsBroker'

Broker.route('get.users', 'UsersController.index')
Broker.route('post.users', 'UsersController.store')
Broker.route('get.users.{id}', 'UsersController.show')
Broker.route('put.users.{id}', 'UsersController.update')
Broker.route('delete.users.{id}', 'UsersController.destroy')
```

### Controllers

Controllers live in `app/Controllers/Nats` (configurable via `namespaces.controllers`). Generate one with `node ace make:nats:controller User`.

```typescript
import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class UsersController {
  public async index({ response }: NatsContextContract) {
    return response.ok([{ id: 1, name: 'Jon' }])
  }

  public async show({ request, response }: NatsContextContract) {
    const id = request.param('id') // from the subject token {id}
    return response.ok({ id })
  }

  public async store({ request, response }: NatsContextContract) {
    const payload = await request.validate({
      schema: schema.create({ name: schema.string() }),
    })
    return response.created({ message: 'User created', data: payload })
  }
}
```

A controller can `return` a value or call a `response.*` helper. The response status travels in a `status` header, not the body.

### Route groups

Group routes to share a subject **prefix** and/or a **middleware** stack, and attach middleware to a single route by chaining `.middleware()`. Groups nest; prefixes and middleware compose from the outside in.

```typescript
import Broker from '@ioc:Adonis/Addons/NatsBroker'

// Every route below is prefixed with `admin.` and runs the `auth` middleware.
Broker.group(() => {
  Broker.route('get.users', 'UsersController.index')                 // admin.get.users
  Broker.route('get.users.{id}', 'UsersController.show')             // admin.get.users.{id}
    .middleware('audit')                                             // auth + audit (this route only)
})
  .prefix('admin')
  .middleware('auth')

// Middleware on a single, ungrouped route.
Broker.route('get.health', 'HealthController.index').middleware('rate')

// Nested groups — prefixes (api.v1.*) and middleware both compose.
Broker.group(() => {
  Broker.group(() => {
    Broker.route('get.stats', 'StatsController.index')               // api.v1.get.stats, runs auth
  }).prefix('v1')
})
  .prefix('api')
  .middleware('auth')
```

The three forms combine freely — the stateful `Broker.middleware(...)` stack (below), group middleware, and per-route `.middleware(...)` all run in order, group middleware first.

### Requesting & publishing

Call another service and await its reply, or fire-and-forget:

```typescript
import Broker from '@ioc:Adonis/Addons/NatsBroker'

// Request/reply — always resolves with { body, headers, request };
// check res.headers.status to handle non-2xx replies.
const res = await Broker.request('get.users', { page: 1 }, { headers: {}, qs: {} })
console.log(res.body, res.headers.status)

// Fire-and-forget.
await Broker.publish('user.created', { id: 1 })
```

### Request & response

Inside a controller, `ctx.request` and `ctx.response` mirror the AdonisJS HTTP API:

| `request` | `response` |
| --- | --- |
| `body()`, `qs()`, `all()` | `ok()`, `created()`, `accepted()`, `noContent()` |
| `input(key, default)` | `badRequest()`, `unauthorized()`, `forbidden()` |
| `param(key, default)` | `notFound()`, `unprocessableEntity()` |
| `header(key, default)` | `internalServerError()`, `status(code).send(body)` |
| `validate(schema)` | `header(key, value)` |
| `set(key, value)` / `get(key)` | …and the rest of the HTTP status helpers |

## Middleware

Middleware run before the controller and can short-circuit it. There are three ways to attach them; they compose.

**Per route / per group** (recommended):

```typescript
Broker.route('get.users', 'UsersController.index').middleware('auth')
Broker.group(() => { /* ... */ }).middleware('auth')
```

**Stateful stack** — `Broker.middleware()` sets a stack applied to every *subsequent* `route()` until changed (call with no args to clear):

```typescript
Broker.middleware('auth')                       // enable for the routes below
Broker.route('get.users', 'UsersController.index')
Broker.route('post.users', 'UsersController.store')
Broker.middleware()                             // clear
Broker.route('get.countries', 'CountriesController.index')
```

Create a middleware class with `node ace make:nats:middleware Auth` (in `app/Middleware/Nats`):

```typescript
import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

export default class Auth {
  // `guards` come from the route, e.g. .middleware('auth:web,api')
  public async handle(
    { request, response }: NatsContextContract,
    next: () => Promise<void>,
    guards?: string[]
  ) {
    if (!request.header('authorization')) {
      return response.unauthorized({ message: 'authorization header is required' })
    }
    request.set('user', { id: 1, name: 'jon' })
    await next()
  }
}
```

Register it in `start/kernel.ts`. The broker reuses AdonisJS's middleware registry, but a NATS middleware's `handle` takes a `NatsContextContract` rather than the HTTP context — so cast the value past the HTTP middleware typing:

```typescript
// Named — referenced by name, optionally with args (`auth:web,api`)
Server.middleware.registerNamed({
  auth: (() => import('App/Middleware/Nats/Auth')) as any,
})

// Global — runs for every NATS request
Server.middleware.register([(() => import('App/Middleware/Nats/LogRequest')) as any])
```

```typescript
// start/broker.ts — pass args to the middleware
Broker.route('get.profile', 'UserController.profile').middleware('auth:web,api')
```

## Exception handling

Thrown errors are routed to `app/Exceptions/Nats/Handler.ts` (created by `node ace init:nats:handler`):

```typescript
import Logger from '@ioc:Adonis/Core/Logger'
import NatsExceptionHandler from '@ioc:Adonis/Addons/NatsExceptionHandler'
import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

export default class ExceptionHandler extends NatsExceptionHandler {
  constructor() {
    super(Logger)
  }

  public async handle(error: any, ctx: NatsContextContract) {
    if (error.code === 'E_VALIDATION_FAILURE') {
      return ctx.response.status(422).send(error.messages)
    }
    return super.handle(error, ctx)
  }
}
```

Create custom exceptions with `node ace make:nats:exception UnAuthorized`, then raise them anywhere — optionally self-handling via a `handle` method:

```typescript
import UnAuthorized from 'App/Exceptions/Nats/UnAuthorizedException'

throw new UnAuthorized('You are not authorized', 403, 'E_UNAUTHORIZED')
```

```typescript
import { Exception } from '@adonisjs/core/build/standalone'
import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

export default class UnAuthorizedException extends Exception {
  public async handle(error: this, ctx: NatsContextContract) {
    ctx.response.status(error.status).send(error.message)
  }
}
```

## JetStream

JetStream adds persistent, replayable messaging. Enable it in config, declare your resources, then sync them to the server.

**1. Declare** streams and durable consumers in `config/nats.ts`:

```typescript
jetstream: {
  enabled: true,
  streams: [
    { name: 'ORDERS', subjects: ['orders.>'], storage: 'file', retention: 'limits' },
  ],
  consumers: [
    { stream: 'ORDERS', durable_name: 'orders-worker', filter_subject: 'orders.created', ack_policy: 'explicit' },
  ],
},
```

**2. Sync** them to the server — idempotent, so it's safe to re-run. It reports each resource as `created`, `updated`, or `exists`:

```bash
node ace nats:sync
```

> Order matters: streams are infrastructure you provision with `nats:sync`. Durable consumers bound with `Jet.consume` are created on app startup if missing, but the **stream must already exist** first.

**Publish** (persistent, returns the server ack):

```typescript
import Jet from '@ioc:Adonis/Addons/NatsJetStream'

const ack = await Jet.publish('orders.created', { id: 1, total: 99 })
console.log(ack.seq) // stored sequence number
```

**Consume** in the controller style. Register in `start/broker.ts` and scaffold a listener with `node ace make:nats:listener Order`:

```typescript
import Jet from '@ioc:Adonis/Addons/NatsJetStream'

Jet.consume(
  { stream: 'ORDERS', durable: 'orders-worker', filterSubject: 'orders.created' },
  'OrderListener.onCreated'
)
```

```typescript
import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

export default class OrderListener {
  public async onCreated({ request, message }: NatsContextContract) {
    const order = request.body()
    // ... process the order ...

    // Auto-acked when the action returns, auto-naked when it throws.
    // Or take manual control via ctx.message:
    //   message?.ack()             done
    //   message?.nak(5000)         retry after 5s
    //   message?.term('bad data')  never redeliver
    //   message?.working()         reset the ack-wait timer for long work
  }
}
```

`Jet.consume` options: `stream` (required), `durable` / `name`, `filterSubject`, `middleware` (named middleware), `ackPolicy`, `deliverPolicy`, `maxDeliver`, `ackWait`, `maxMessages`, and `autoAck` (default `true`).

## Key-Value store

```typescript
import KV from '@ioc:Adonis/Addons/NatsKV'

const sessions = await KV.bucket('sessions')   // created if needed, cached per name
await sessions.put('user:1', JSON.stringify({ name: 'jon' }))

const entry = await sessions.get('user:1')
console.log(entry?.json()) // { name: 'jon' }

const watch = await sessions.watch()
for await (const e of watch) {
  console.log(e.key, e.operation)
}
```

`bucket()` returns the native nats.js `KV`, so its full API (`keys`, `history`, `purge`, `delete`, `watch`, …) is available. Declare buckets under `kv.buckets` in config to provision them with `nats:sync`.

## Object store

```typescript
import ObjectStore from '@ioc:Adonis/Addons/NatsObjectStore'

// Buffer/string convenience helpers
await ObjectStore.putBlob('uploads', 'avatar.png', someUint8Array)
const bytes = await ObjectStore.getBlob('uploads', 'avatar.png') // Uint8Array | null

// Or the native streaming ObjectStore API
const bucket = await ObjectStore.bucket('uploads')
const list = await bucket.list()
```

## Connection events

The shared connection forwards its lifecycle onto the AdonisJS event emitter:

```typescript
import Event from '@ioc:Adonis/Core/Event'

Event.on('nats:connect', ({ connection }) => {})
Event.on('nats:reconnect', ({ connection }) => {})
Event.on('nats:disconnect', ({ connection }) => {})
Event.on('nats:closed', ({ connection, error }) => {})
Event.on('nats:error', ({ connection, error }) => {})
```

## Testing

`test.ts` is a run mode, so when the test app boots it opens the connection and starts consuming — your routes answer requests sent from within the test. A NATS server must be running (and `node ace nats:sync` applied if you use JetStream / KV / Object Store).

### Using the broker directly (recommended)

`Broker.request` always resolves with the response, so assert on `res.headers.status` and `res.body` — no try/catch needed. Generate a spec with `node ace make:nats:test Users`:

```typescript
import { test } from '@japa/runner'
import Broker from '@ioc:Adonis/Addons/NatsBroker'

test.group('Users', () => {
  test('lists users', async ({ assert }) => {
    const res = await Broker.request('v1.get.users', {}, { headers: { authorization: 'test' } })
    assert.equal(res.headers.status, 200)
    assert.deepInclude(res.body[0], { id: 1, name: 'Jon' })
  })

  test('rejects without auth', async ({ assert }) => {
    const res = await Broker.request('v1.get.users')
    assert.equal(res.headers.status, 401)
  })
})
```

JetStream, KV, and Object Store are tested the same way — import the binding and call it:

```typescript
import Jet from '@ioc:Adonis/Addons/NatsJetStream'

test('publishes to a stream', async ({ assert }) => {
  const ack = await Jet.publish('users.created', { id: 42 })
  assert.isAbove(ack.seq, 0)
})
```

### Using the test client plugin (optional)

The package also ships a japa plugin that adds a `broker` test context with chainable assertions. Register it in `tests/bootstrap.ts`:

```typescript
import { natsClient } from 'adonis5-nats-broker/build/src/test'
import Broker from '@ioc:Adonis/Addons/NatsBroker'

export const plugins: Required<Config>['plugins'] = [
  assert(),
  apiClient(),
  natsClient(Broker),
]
```

```typescript
test('get users', async ({ broker }) => {
  const response = await broker.request('v1.get.users', {}, { headers: { authorization: 'test' } })
  response.assertStatus(200)
  response.assertBodyContains([{ id: 1 }])
})
```

## Ace commands

| Command | Description |
| --- | --- |
| `node ace configure adonis5-nats-broker` | Scaffold `config/nats.ts` and `start/broker.ts`, wire the provider |
| `node ace init:nats:handler` | Create the global exception handler |
| `node ace make:nats:controller <Name>` | New controller |
| `node ace make:nats:listener <Name>` | New JetStream listener (consumer controller) |
| `node ace make:nats:middleware <Name>` | New middleware |
| `node ace make:nats:exception <Name>` | New custom exception |
| `node ace make:nats:test <Name>` | New NATS test |
| `node ace nats:sync` | Reconcile streams, consumers, and KV / Object Store buckets from config |

## Migrating from v1

v2 is a breaking rewrite. The main changes:

- **Config reshape** — core request/reply settings moved under a `core` key: `routes` → `core.routes`, `request` → `core.request`, `publish` → `core.publish`. New `jetstream`, `kv`, and `objectStore` sections were added. Re-run `node ace configure adonis5-nats-broker` to regenerate `config/nats.ts`, then port your values.
- **One shared connection** — `request` / `publish` no longer open a connection per call; everything reuses a single lazily-opened connection.
- **nats.js v3** — the package now depends on the modular `@nats-io/*` packages instead of `nats@2`. Application code that only uses the `@ioc:Adonis/Addons/Nats*` bindings needs no changes.
- **New capabilities** — JetStream, KV, Object Store, route groups, per-route middleware, and `node ace nats:sync`.

## License

[MIT](LICENSE.md)
