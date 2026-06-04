import Env from '@ioc:Adonis/Core/Env'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'

const config: ConfigContract = {
    /*
    |--------------------------------------------------------------------------
    | Run modes
    |--------------------------------------------------------------------------
    | Process entrypoints for which the broker opens its connection and starts
    | consuming routes + JetStream consumers on boot.
    */
    runModes: ['test.ts', 'server.js', 'server.ts'],

    ignoreMiddlewares: ['BodyParserMiddleware'],

    generateRequestId: true,

    /*
    |--------------------------------------------------------------------------
    | Connection
    |--------------------------------------------------------------------------
    | The single shared NATS connection, reused by routes, requests, publishes,
    | JetStream, KV, and Object Store.
    */
    connection: {
        name: Env.get('NATS_NAME'),
        servers: Env.get('NATS_SERVER'),
        maxReconnectAttempts: 10,
        pingInterval: 5000,
        reconnect: true,
        reconnectTimeWait: 2000,
        timeout: 30000,
    },

    namespaces: {
        controllers: 'app/Controllers/Nats',
        middleware: 'app/Middleware/Nats',
        exceptions: 'app/Exceptions/Nats',
        exceptionHandler: 'app/Exceptions/Nats/Handler',
        listeners: 'app/Controllers/Nats',
    },

    /*
    |--------------------------------------------------------------------------
    | Core NATS (request/reply + publish)
    |--------------------------------------------------------------------------
    */
    core: {
        routes: {
            options: {},
            prefix: '',
        },
        request: {
            timeout: 30000,
            prefix: '',
            headers: {},
            qs: {},
        },
        publish: {
            prefix: '',
            headers: {},
            qs: {},
        },
    },

    /*
    |--------------------------------------------------------------------------
    | JetStream
    |--------------------------------------------------------------------------
    | Set `enabled` to true to start JetStream consumers on boot. Declare your
    | streams and durable consumers here, then run `node ace nats:sync` to
    | reconcile them with the server (idempotent).
    */
    jetstream: {
        enabled: true,
        streams: [
            { name: 'USERS', subjects: ['users.>'] },
        ],
        consumers: [
            { stream: 'USERS', durable_name: 'users-worker', filter_subject: 'users.created', ack_policy: 'explicit' },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Key-Value buckets
    |--------------------------------------------------------------------------
    */
    kv: {
        buckets: [
            { name: 'sessions' },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | Object Store buckets
    |--------------------------------------------------------------------------
    */
    objectStore: {
        buckets: [
            { name: 'uploads' },
        ],
    },
}

export default config
