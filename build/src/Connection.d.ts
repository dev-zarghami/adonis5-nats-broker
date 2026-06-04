/// <reference types="@adonisjs/events/build/adonis-typings" />
/// <reference types="@adonisjs/logger/build/adonis-typings/logger" />
import type { NatsConnection } from '@nats-io/nats-core';
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker';
import type { EmitterContract } from '@ioc:Adonis/Core/Event';
import type { LoggerContract } from '@ioc:Adonis/Core/Logger';
/**
 * Owns the single, shared NATS connection for the whole process.
 *
 * The connection is opened **lazily** on first use and cached, so outbound
 * requests/publishes, JetStream, KV, and Object Store all reuse one socket
 * instead of opening a fresh connection per call (the v1 behaviour). This
 * also decouples "having a connection" from "running as the NATS server" —
 * KV/Object/JetStream-publish work from any process, e.g. an HTTP handler.
 */
export default class Connection {
    private config;
    private event;
    private logger;
    private connection?;
    private connecting?;
    constructor(config: ConfigContract, event: EmitterContract, logger: LoggerContract);
    /**
     * Whether the shared connection is currently open.
     */
    isConnected(): boolean;
    /**
     * The current connection, if any. Prefer `use()` which opens it on demand.
     */
    current(): NatsConnection | undefined;
    /**
     * Open (or reuse) the shared connection. Concurrent callers awaiting the
     * first connect share the same in-flight promise.
     */
    use(): Promise<NatsConnection>;
    private open;
    /**
     * Forward the connection's reconnect/disconnect lifecycle onto the AdonisJS
     * event emitter so apps can react (e.g. health checks).
     */
    private monitorStatus;
    /**
     * Gracefully drain and close the shared connection.
     */
    close(): Promise<void>;
}
