/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'
import Config from '../src/Config'
import Connection from '../src/Connection'
import Dispatcher from '../src/Dispatcher'
import Router from '../src/Router'
import Client from '../src/Client'
import Broker from '../src/Broker'
import JetStream from '../src/JetStream'
import KeyValue from '../src/KV'
import ObjectStoreManager from '../src/ObjectStore'
import Stream from '../src/Stream'
import ExceptionHandler from '../src/ExceptionHandler'
import { natsClient } from '../src/test'

export default class NatsProvider {
  public static needsApplication = true

  private config: ConfigContract = Config
  private connection!: Connection
  private broker!: Broker
  private jetstream!: JetStream
  private kv!: KeyValue
  private objectStore!: ObjectStoreManager
  private stream!: Stream
  private shouldConnect = false

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonis/Addons/NatsBroker', () => this.broker)
    this.app.container.singleton('Adonis/Addons/NatsJetStream', () => this.jetstream)
    this.app.container.singleton('Adonis/Addons/NatsKV', () => this.kv)
    this.app.container.singleton('Adonis/Addons/NatsObjectStore', () => this.objectStore)
    this.app.container.singleton('Adonis/Addons/NatsStream', () => this.stream)
    this.app.container.singleton('Adonis/Addons/NatsExceptionHandler', () => ExceptionHandler)
    this.app.container.singleton('Adonis/Addons/NatsTest', () => ({ natsClient }))
  }

  public async boot() {
    const event = this.app.container.use('Adonis/Core/Event')
    const logger = this.app.container.use('Adonis/Core/Logger')
    const server = this.app.container.use('Adonis/Core/Server')

    // Merge the published default config with the app's `config/nats.ts`.
    this.config = Object.assign(
      {},
      Config,
      this.app.container.use('Adonis/Core/Config').get('nats')
    )

    // Wire the modules with explicit dependencies (no private-field hacks).
    this.connection = new Connection(this.config, event, logger)
    const dispatcher = new Dispatcher(this.app, server, logger, this.config)
    const router = new Router(this.app, server, logger, this.config, this.connection, dispatcher)
    const client = new Client(this.app, this.config, this.connection)

    this.broker = new Broker(this.connection, router, client)
    this.jetstream = new JetStream(
      this.app,
      server,
      logger,
      this.config,
      this.connection,
      dispatcher
    )
    this.kv = new KeyValue(this.connection)
    this.objectStore = new ObjectStoreManager(this.connection)
    this.stream = new Stream(this.config, this.jetstream, this.kv, this.objectStore, logger)

    // Only open the connection + start consuming when running as a server/test
    // process. KV/Object/JetStream-publish still connect lazily on first use
    // from any process (e.g. an HTTP handler).
    this.shouldConnect =
      process.argv.length >= 2
        ? this.config.runModes.map((mode) => process.argv[1].endsWith(mode)).includes(true)
        : false
  }

  public async ready() {
    if (!this.shouldConnect) return
    await this.broker.createConnection()
    await this.jetstream.start()
  }

  public async shutdown() {
    if (this.connection && this.connection.isConnected()) {
      await this.connection.close()
    }
  }
}
