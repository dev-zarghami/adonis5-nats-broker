/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { AckPolicy, jetstream, jetstreamManager } from '@nats-io/jetstream'
import type { ConsumerConfig, JetStreamClient, JetStreamManager, PubAck } from '@nats-io/jetstream'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { ServerContract } from '@ioc:Adonis/Core/Server'
import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'
import type {
  NatsJetStreamContract,
  NatsConsumeOptions,
  NatsJetStreamPublishOptions,
} from '@ioc:Adonis/Addons/NatsJetStream'
import type Connection from './Connection'
import type Dispatcher from './Dispatcher'
import Request from './Context/Request'
import Response from './Context/Response'
import Message from './Context/Message'
import { buildHeaders, parseNatsParams } from './Helpers'

interface ConsumeBinding {
  options: NatsConsumeOptions
  middlewares: any[]
  controller: string
}

/**
 * JetStream facade: persistent publish (with ack) and consumer registration in
 * the same controller style as core routes. Consumers reuse the shared
 * connection and run the same middleware pipeline as `Router`, with ack/nak
 * controls exposed on `ctx.message`.
 */
export default class JetStream implements NatsJetStreamContract {
  private js?: JetStreamClient
  private jsm?: JetStreamManager
  private readonly bindings: ConsumeBinding[] = []

  constructor(
    private app: ApplicationContract,
    private server: ServerContract,
    private logger: LoggerContract,
    private config: ConfigContract,
    private connection: Connection,
    private dispatcher: Dispatcher
  ) {}

  /**
   * The JetStream client (cached), for advanced direct use.
   */
  public async client(): Promise<JetStreamClient> {
    if (this.js) return this.js
    const nc = await this.connection.use()
    this.js = jetstream(nc)
    return this.js
  }

  /**
   * The JetStream manager (cached), for stream/consumer administration.
   */
  public async manager(): Promise<JetStreamManager> {
    if (this.jsm) return this.jsm
    const nc = await this.connection.use()
    this.jsm = await jetstreamManager(nc)
    return this.jsm
  }

  /**
   * Persistently publish a message to a stream subject and return the server's
   * acknowledgement. Uses the same `{ body, qs }` envelope as core publishes so
   * the same controllers can read it.
   */
  public async publish(
    subject: string,
    body: object = {},
    options: NatsJetStreamPublishOptions = {}
  ): Promise<PubAck> {
    const js = await this.client()
    const payload = JSON.stringify({ body: body || {}, qs: options.qs || {} })
    return js.publish(subject, payload, {
      headers: buildHeaders(options.headers || {}),
      ...(options.msgID ? { msgID: options.msgID } : {}),
      ...(options.timeout ? { timeout: options.timeout } : {}),
    })
  }

  /**
   * Register a JetStream consumer bound to a controller action. The consumer is
   * created on startup if it does not already exist.
   */
  public consume(options: NatsConsumeOptions, controller: string): this {
    this.bindings.push({
      options,
      middlewares: this.resolveMiddleware(options.middleware),
      controller,
    })
    return this
  }

  /**
   * Begin consuming every registered binding. No-op unless JetStream is enabled
   * in config. Called by the provider in server run modes.
   */
  public async start(): Promise<void> {
    if (!this.config.jetstream.enabled) return
    for (const binding of this.bindings) {
      this.runConsumer(binding).catch((error) =>
        this.logger.error(
          { err: error },
          `[NATS] JetStream consumer crashed for stream ${binding.options.stream}`
        )
      )
    }
  }

  private async runConsumer(binding: ConsumeBinding): Promise<void> {
    const { options } = binding
    const name = options.durable || options.name
    await this.ensureConsumer(options)

    const js = await this.client()
    const consumer = await js.consumers.get(options.stream, name)
    const Controller = await this.dispatcher.resolveController(binding.controller)
    const patternForParams = typeof options.filterSubject === 'string' ? options.filterSubject : ''
    const autoAck = options.autoAck !== false

    const messages = await consumer.consume(
      options.maxMessages ? ({ max_messages: options.maxMessages } as any) : undefined
    )
    this.logger.info(
      `[NATS] JetStream consumer mapped { ${options.stream}${name ? `/${name}` : ''} }`
    )

    for await (const msg of messages) {
      const context: any = {
        config: this.config,
        params: patternForParams ? parseNatsParams(msg, patternForParams) : {},
        logger: this.logger,
        routeKey: msg.subject,
      }
      const message = new Message(msg)
      try {
        context.message = message
        context.response = new Response(() => {})
        context.request = new Request(this.app, context, msg, patternForParams)
        await this.dispatcher.runMiddleware(context, binding.middlewares)
        await Controller(context)
        if (autoAck && !message.settled) msg.ack()
      } catch (error) {
        await this.dispatcher.handleException(error, context)
        if (autoAck && !message.settled) msg.nak()
      }
    }
  }

  /**
   * Create the durable consumer if it does not already exist. Streams must
   * already exist (provision them via `node ace nats:sync`); consumers are
   * app-owned and created on demand.
   */
  private async ensureConsumer(options: NatsConsumeOptions): Promise<void> {
    const name = options.durable || options.name
    if (!name) return // ordered ephemeral consumer — created implicitly by get()

    const jsm = await this.manager()
    try {
      await jsm.consumers.info(options.stream, name)
      return
    } catch {
      // not found — create below
    }

    const cfg: Partial<ConsumerConfig> = {
      durable_name: name,
      ack_policy: (options.ackPolicy as any) || AckPolicy.Explicit,
    }
    if (Array.isArray(options.filterSubject)) cfg.filter_subjects = options.filterSubject
    else if (options.filterSubject) cfg.filter_subject = options.filterSubject
    if (options.deliverPolicy) cfg.deliver_policy = options.deliverPolicy as any
    if (options.maxDeliver) cfg.max_deliver = options.maxDeliver
    if (options.ackWait) cfg.ack_wait = options.ackWait

    await jsm.consumers.add(options.stream, cfg as ConsumerConfig)
    this.logger.info(`[NATS] Created JetStream consumer ${options.stream}/${name}`)
  }

  private resolveMiddleware(names: string[] = []): any[] {
    const items: any[] = []
    for (const mid of names) {
      const name = mid.split(':')[0]
      const named: any = this.server.middleware.getNamed(name)
      if (named) {
        named.args = mid.split(':').length === 2 ? mid.split(':')[1].split('.') : []
        items.push(named)
      } else {
        this.logger.error(`[NATS] cannot find ${name} middleware`)
      }
    }
    return items
  }
}
