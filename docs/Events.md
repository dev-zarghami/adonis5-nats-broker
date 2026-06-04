## Events

The `@ioc:Adonis/Core/Event` module is extended with NATS connection lifecycle events. The shared connection emits these so the app can react (health checks, logging, etc.):

1. **`nats:connect`**: The connection was established.
   - `connection`: the `NatsConnection` (or an `Error` if the initial connect failed).

2. **`nats:reconnect`**: The client reconnected after a drop.
   - `connection`: the `NatsConnection`.

3. **`nats:disconnect`**: The client lost its link to the server (and on graceful close).
   - `connection`: the `NatsConnection`.

4. **`nats:closed`**: The connection was closed.
   - `error`: any error that caused the closure, or `null`.
   - `connection`: the `NatsConnection`.

5. **`nats:error`**: A connection-level error occurred.
   - `error`: the error / status.
   - `connection`: the `NatsConnection` (or an `Error`).

```typescript
import Event from '@ioc:Adonis/Core/Event'

Event.on('nats:reconnect', ({ connection }) => {
  // ...
})
```
