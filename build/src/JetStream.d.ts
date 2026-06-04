/// <reference types="@adonisjs/application/build/adonis-typings" />
/// <reference types="@adonisjs/http-server/build/adonis-typings" />
/// <reference types="@adonisjs/logger/build/adonis-typings/logger" />
import type { JetStreamClient, JetStreamManager, PubAck } from '@nats-io/jetstream';
import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
import type { ServerContract } from '@ioc:Adonis/Core/Server';
import type { LoggerContract } from '@ioc:Adonis/Core/Logger';
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker';
import type { NatsJetStreamContract, NatsConsumeOptions, NatsJetStreamPublishOptions } from '@ioc:Adonis/Addons/NatsJetStream';
import type Connection from './Connection';
import type Dispatcher from './Dispatcher';
/**
 * JetStream facade: persistent publish (with ack) and consumer registration in
 * the same controller style as core routes. Consumers reuse the shared
 * connection and run the same middleware pipeline as `Router`, with ack/nak
 * controls exposed on `ctx.message`.
 */
export default class JetStream implements NatsJetStreamContract {
    private app;
    private server;
    private logger;
    private config;
    private connection;
    private dispatcher;
    private js?;
    private jsm?;
    private readonly bindings;
    constructor(app: ApplicationContract, server: ServerContract, logger: LoggerContract, config: ConfigContract, connection: Connection, dispatcher: Dispatcher);
    /**
     * The JetStream client (cached), for advanced direct use.
     */
    client(): Promise<JetStreamClient>;
    /**
     * The JetStream manager (cached), for stream/consumer administration.
     */
    manager(): Promise<JetStreamManager>;
    /**
     * Persistently publish a message to a stream subject and return the server's
     * acknowledgement. Uses the same `{ body, qs }` envelope as core publishes so
     * the same controllers can read it.
     */
    publish(subject: string, body?: object, options?: NatsJetStreamPublishOptions): Promise<PubAck>;
    /**
     * Register a JetStream consumer bound to a controller action. The consumer is
     * created on startup if it does not already exist.
     */
    consume(options: NatsConsumeOptions, controller: string): this;
    /**
     * Begin consuming every registered binding. No-op unless JetStream is enabled
     * in config. Called by the provider in server run modes.
     */
    start(): Promise<void>;
    private runConsumer;
    /**
     * Create the durable consumer if it does not already exist. Streams must
     * already exist (provision them via `node ace nats:sync`); consumers are
     * app-owned and created on demand.
     */
    private ensureConsumer;
    private resolveMiddleware;
}
