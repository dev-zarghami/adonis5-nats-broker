## Config

The `config/nats.ts` file configures the NATS broker within an AdonisJS application. The v2 shape:

1. **`runModes`**: Process entrypoints (e.g. `'test.ts'`, `'server.js'`, `'server.ts'`) for which the broker opens its connection and starts consuming routes + JetStream consumers on boot. Other processes (e.g. the HTTP server, ace commands) connect lazily only when they use the broker, KV, Object Store, or JetStream publish.

2. **`ignoreMiddlewares`**: Global middleware names to skip during NATS request processing (e.g. `'BodyParserMiddleware'`).

3. **`generateRequestId`**: Whether to auto-generate an `x-request-id` header when one is absent.

4. **`connection`**: The single shared NATS connection options, reused by routes, requests, publishes, JetStream, KV, and Object Store:
    - `name`: A name for the connection.
    - `servers`: The NATS server URL(s), e.g. `'nats://localhost:4222'`.
    - `maxReconnectAttempts`, `pingInterval`, `reconnect`, `reconnectTimeWait`, `timeout`: standard nats.js connection options.

5. **`namespaces`**: Resolution paths for `controllers`, `middleware`, `exceptions`, `exceptionHandler`, and `listeners`.

6. **`core`**: Core (non-JetStream) request/reply and publish behaviour:
    - **`routes`**: `options` (subscription options) and `prefix` (subject prefix for routes).
    - **`request`**: `timeout`, `prefix`, `headers`, `qs` defaults for outbound requests.
    - **`publish`**: `prefix`, `headers`, `qs` defaults for outbound publishes.

7. **`jetstream`**: JetStream configuration:
    - `enabled`: Start JetStream consumers on boot.
    - `domain` (optional): JetStream domain.
    - `streams`: Streams declared for `node ace nats:sync` to reconcile (raw nats.js `StreamConfig`, with `name` required).
    - `consumers`: Durable consumers declared for sync (`{ stream }` plus raw `ConsumerConfig` fields such as `durable_name`, `filter_subject`, `ack_policy`).

8. **`kv`**: `buckets` — KV buckets to ensure on sync (`{ name }` plus `KvOptions`).

9. **`objectStore`**: `buckets` — Object Store buckets to ensure on sync (`{ name }` plus `ObjectStoreOptions`).

> The provider shallow-merges your `config/nats.ts` over the defaults, so keep the file a complete config object.
