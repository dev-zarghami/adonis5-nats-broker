/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'

const config: ConfigContract = {
  runModes: ['test.ts', 'server.js', 'server.ts'],
  ignoreMiddlewares: ['BodyParserMiddleware'],
  generateRequestId: true,
  connection: {
    name: 'adonis5-nats-broker',
    servers: 'nats://localhost:4222',
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
  jetstream: {
    enabled: false,
    streams: [],
    consumers: [],
  },
  kv: {
    buckets: [],
  },
  objectStore: {
    buckets: [],
  },
}

export default config
