# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`adonis5-nats-broker` is an AdonisJS v5 addon (npm package, not an app) that bridges NATS into AdonisJS's HTTP-style request/response model. A service exposes NATS subjects as "routes" handled by controllers, calls other services via request/publish, consumes **JetStream** streams with the same controller style, and gets injected **KV** and **Object Store** managers — all reusing AdonisJS's middleware, validator, exception handling, and logger. Think "REST-to-NATS proxy": NATS subjects play the role of URLs and dot-separated segments (e.g. `get.users.{id}`) play the role of HTTP method + path.

**v2 is a breaking rewrite** of the original monolithic v1: the single 315-line `Broker` was split into focused modules, the connection model was fixed (see below), and the library was migrated from monolithic `nats@2` to the modular **nats.js v3** packages (`@nats-io/*`).

The package compiles TypeScript from the repo root into `build/`, which is what consumers install. `build/providers/NatsProvider.js` is the published entry point.

## Commands

```bash
npm run build        # lint + clean + tsc + copy templates/ into build/ (this is `compile`)
npm run lint         # eslint . --ext=.ts  (runs automatically before publish via prepublishOnly)
npm run lint:fix     # eslint --fix
npm run format       # prettier --write .
npm run clean        # rm -rf build
```

There is **no automated test suite in this repo**. The `src/test/` directory is the *testing client shipped to consumers* (the `natsClient` japa plugin), not tests for this package. Don't assume `npm test` works.

Verification is build + manual smoke test:
- `npm run build` is the primary correctness gate (the package is types-heavy; `tsc` against the real `@nats-io` `.d.ts` files catches most regressions).
- For a live JetStream-enabled server: `docker run -d --name nats -p 4222:4222 nats -js`. The bundled `docker-compose.yaml` starts plain NATS **without** JetStream — pass `-js` if you need streams/KV/Object Store.

## nats.js v3 specifics (important)

The modular v3 API differs from v1's `nats@2`. Key facts the code depends on:
- `connect` comes from `@nats-io/transport-node`. **`headers`/`Empty` are imported from `@nats-io/nats-core`** (transport-node re-exports them at runtime but not in its `.d.ts`, so import core for types to resolve).
- There is **no `StringCodec`/`JSONCodec`** anymore. Payloads (`Payload = Uint8Array | string`) are passed as plain strings; messages are decoded with `msg.string()` / `msg.json<T>()`.
- `MsgHdrs` has no internal `.headers` map — iterate with `keys()` + `get()` (see `headersToObject` in `src/Helpers.ts`).
- JetStream: `jetstream(nc)` (sync) and `await jetstreamManager(nc)` from `@nats-io/jetstream`; consume via `js.consumers.get(stream, name)` → `consumer.consume()` (async iterable of `JsMsg`); `JsMsg` carries `ack()/nak()/term()/working()`. Enums like `AckPolicy` are const objects (`AckPolicy.Explicit === 'explicit'`).
- KV: `new Kvm(nc)` → `.create(name)`/`.open(name)`. Object Store: `new Objm(nc)` → `.create(name)`/`.open(name)`; `put` takes / `get` returns a web `ReadableStream` (`src/ObjectStore.ts` imports `ReadableStream` from `node:stream/web` and wraps it with `putBlob`/`getBlob` for the common buffer case).

## Architecture

The `Broker` is now a thin facade; responsibilities are split across single-purpose modules wired together by the provider.

### Lifecycle (providers/NatsProvider.ts)
`register()` binds the container singletons; `boot()` constructs every module with **explicit constructor injection** (no more `this.broker['app'] = ...` private-field hacks) using a config merged from `src/Config.ts` defaults + the consumer's `config/nats.ts`. `ready()` opens the connection and starts the subscription loops **only when the process entrypoint matches `config.runModes`** (default `['test.ts','server.js','server.ts']`) — so ace commands don't start consuming. `shutdown()` drains/closes.

Container bindings:
| Binding | Backed by |
| --- | --- |
| `Adonis/Addons/NatsBroker` | `src/Broker.ts` (core route/request/publish + connection) |
| `Adonis/Addons/NatsJetStream` | `src/JetStream.ts` |
| `Adonis/Addons/NatsKV` | `src/KV.ts` |
| `Adonis/Addons/NatsObjectStore` | `src/ObjectStore.ts` |
| `Adonis/Addons/NatsStream` | `src/Stream.ts` (used by the `nats:sync` command) |
| `Adonis/Addons/NatsExceptionHandler` | `src/ExceptionHandler.ts` |
| `Adonis/Addons/NatsTest` | `src/test` (`natsClient` japa plugin) |

### Connection model — the key v2 fix (src/Connection.ts)
v1 opened and closed a **fresh connection on every `request()`/`publish()` call**, and only ever connected at all in server run mode. `Connection` now owns **one shared, lazily-opened connection** (`use()` connects once and caches). Outbound calls, JetStream, KV, and Object Store all reuse it — so **KV/Object/JetStream-publish work from any process, including HTTP request handlers**, not just the NATS server process. Only the *subscription loops* (Router + JetStream consumers) are gated on `runModes`. `Connection` also forwards reconnect/disconnect/close onto the AdonisJS event emitter (`nats:connect`/`nats:reconnect`/`nats:disconnect`/`nats:closed`/`nats:error`).

### Core routing (src/Router.ts + src/Route.ts + src/RouteGroup.ts + src/Client.ts + src/Dispatcher.ts)
- **`Router`** owns the route registry and the request/reply subscription loop. Routes form a **tree** of `Route`/`RouteGroup` nodes; prefixes and middleware are resolved/composed once in `resolveRoutes()` at `start()` (not at registration), so `Broker.group(cb).prefix(...).middleware(...)` can set them *after* the callback runs (AdonisJS-style). Three composable ways to attach middleware: the *stateful* `middleware()` stack (set on subsequent `route()` calls until changed; call with no args to clear), per-route `route(...).middleware(...)`, and group `group(...).middleware(...)`. Effective stack = ancestor group middleware (outer→inner) + the route's own. Effective subject = `config.core.routes.prefix` + group prefixes (outer→inner) + route pattern, mapped to a subject via `createSubject` (`{id}` → `*`). Middleware specs (name strings / arrays / inline functions) are stored raw and resolved against `server.middleware.getNamed` at `start()`.
- **`Client`** implements `request()`/`publish()` reusing the shared connection. `request()` may still target a different server via `options.servers`, in which case it opens a dedicated short-lived connection for just that call. It always resolves with the response — callers inspect `response.headers.status` to handle non-2xx replies (it does not throw on `>= 400`).
- **`Dispatcher`** is the shared execution engine for both `Router` and `JetStream`: it dynamically imports `Controller.action` handlers from `config.namespaces.*`, runs the middleware pipeline (global minus `ignoreMiddlewares` → route middleware → controller), and forwards throws to the app's NATS exception handler.

### JetStream (src/JetStream.ts)
`Jet.publish(subject, body, opts)` does a persistent publish (returns `PubAck`) using the **same `{ body, qs }` envelope** as core publishes, so the same controllers can read it. `Jet.consume({ stream, durable, filterSubject, ... }, 'Controller.action')` registers a consumer that runs the **same Dispatcher pipeline** as a route, building the same context plus `ctx.message` (`src/Context/Message.ts`) exposing `ack()/nak()/term()/working()`. Default policy: controller returns ⇒ auto-`ack`; throws ⇒ auto-`nak` (toggle with `autoAck: false`). Durable consumers are auto-created on startup if missing; **streams must already exist** (provision them via `nats:sync`). Consumers only start when `config.jetstream.enabled` is true.

### KV & Object Store (src/KV.ts, src/ObjectStore.ts)
Thin managers over `Kvm`/`Objm`. `bucket(name)` returns the native v3 `KV`/`ObjectStore` (cached per name) so the full upstream API is available; `ObjectStore` adds `putBlob`/`getBlob` buffer convenience.

### Declarative resource management (src/Stream.ts + commands/NatsSync.ts)
`config.jetstream.streams`/`consumers`, `config.kv.buckets`, and `config.objectStore.buckets` are the declarative source of truth. `node ace nats:sync` (`Stream.sync()`) idempotently reconciles them with the server — "migrations for JetStream". Safe to re-run; a second run reports streams as `updated` and existing consumers/buckets as `exists`.

### Context primitives (src/Context/)
- **`Request.ts`** — wraps the message: parses headers (v3 `keys()`/`get()`), body (`{body}`), qs (`{qs}` JSON or query string), and route params (positional match of `{name}` segments — `parseNatsParams` in `Helpers.ts` iterates by index, fixing a v1 `indexOf` bug with duplicate segments). Exposes `body/qs/params/all/input/param/header/headers`, `validate(...)`, `set/get`, and `id()` for `x-request-id`.
- **`Response.ts`** — buffers status + headers + body; on `send()` JSON-encodes the body, appends a `status` header, and invokes the responder callback. Full set of HTTP-status helpers (`ok`, `created`, `unauthorized`, ...). **Status travels in a `status` header, not the body** — this is how callers and `ResponseAssert` read the response status.
- **`Message.ts`** — JetStream ack controls on `ctx.message`; tracks `settled` so the consumer loop knows whether to auto-ack/nak.

### Type contracts (adonis-typings/)
The `@ioc:Adonis/Addons/Nats*` module declarations live here, aggregated by `index.ts`: `broker.ts` (incl. the regrouped `ConfigContract`), `jetstream.ts`, `kv.ts`, `object-store.ts`, `request.ts`, `response.ts`, `context.ts`, `event.ts`, `validator.ts`, `test.ts`, `exception-handler.ts`. When changing a public signature in `src/`, update the matching contract or consumer-facing types drift.

### Ace generators (commands/)
`MakeController`, `MakeMiddleware`, `MakeListener` (JetStream consumer stub), `MakeTest`, `MakeException`, `MakeHandler`, and `NatsSync`. Each generator reads a stub from `templates/*.txt` (Mustache) and writes into the consumer's `app/...` tree. `templates/` must be copied into `build/` at compile time (the `compile` script does `cp -r templates build/`) or generators break at runtime.

## Config shape (breaking change from v1)

Core request/reply settings moved under a `core` key. Top level is now:
`runModes`, `ignoreMiddlewares`, `generateRequestId`, `connection`, `namespaces` (+ `listeners`), `core: { routes, request, publish }`, `jetstream: { enabled, domain?, streams[], consumers[] }`, `kv: { buckets[] }`, `objectStore: { buckets[] }`. The provider **shallow-merges** the user's `config/nats.ts` over the defaults, so the published `templates/config.txt` is a complete config (keep it complete when editing).

## Wire format

A message body on the wire is JSON `{ body: {...}, qs: {...} }` (same for core and JetStream). The response status is carried in a NATS `status` header. Header values that are objects are `JSON.stringify`'d before being appended. Keep this contract stable — both ends of the broker and the test client depend on it.

## Conventions

- TypeScript with experimental decorators; config extends `@adonisjs/mrm-preset/_tsconfig` (target es2020, `lib: ["es2020"]`, `noUnusedLocals`/`noUnusedParameters` on — so no stray imports).
- Adonis `@ioc:` modules are always `import type` (erased at compile) — never a runtime value import, or the built CommonJS will fail to require outside an app.
- Code style enforced by `eslint-plugin-adonis` + prettier (no semicolons, single quotes, 100-col print width — see `.prettierrc`). Run `npm run lint:fix` after edits.
- `docs/` contains the consumer-facing reference (Config, Request, Response, Context, Events, RequestValidator, Test) — note some of these still describe the v1 config shape; keep them in mind when consulting.
