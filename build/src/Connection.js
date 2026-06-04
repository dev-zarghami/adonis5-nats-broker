"use strict";
/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const transport_node_1 = require("@nats-io/transport-node");
/**
 * Owns the single, shared NATS connection for the whole process.
 *
 * The connection is opened **lazily** on first use and cached, so outbound
 * requests/publishes, JetStream, KV, and Object Store all reuse one socket
 * instead of opening a fresh connection per call (the v1 behaviour). This
 * also decouples "having a connection" from "running as the NATS server" —
 * KV/Object/JetStream-publish work from any process, e.g. an HTTP handler.
 */
class Connection {
    constructor(config, event, logger) {
        this.config = config;
        this.event = event;
        this.logger = logger;
    }
    /**
     * Whether the shared connection is currently open.
     */
    isConnected() {
        return !!this.connection;
    }
    /**
     * The current connection, if any. Prefer `use()` which opens it on demand.
     */
    current() {
        return this.connection;
    }
    /**
     * Open (or reuse) the shared connection. Concurrent callers awaiting the
     * first connect share the same in-flight promise.
     */
    async use() {
        if (this.connection)
            return this.connection;
        if (this.connecting)
            return this.connecting;
        this.connecting = this.open();
        try {
            this.connection = await this.connecting;
            return this.connection;
        }
        catch (error) {
            this.event.emit('nats:error', { connection: this.connection, error });
            throw error;
        }
        finally {
            this.connecting = undefined;
        }
    }
    async open() {
        const connection = await (0, transport_node_1.connect)(this.config.connection);
        this.logger.info(`[NATS] Connected to ${connection.getServer()}`);
        this.event.emit('nats:connect', { connection });
        this.monitorStatus(connection);
        connection.closed().then((error) => {
            this.connection = undefined;
            if (error)
                this.logger.error(`[NATS] Connection closed: ${error}`);
            this.event.emit('nats:closed', { connection, error });
        });
        return connection;
    }
    /**
     * Forward the connection's reconnect/disconnect lifecycle onto the AdonisJS
     * event emitter so apps can react (e.g. health checks).
     */
    monitorStatus(connection) {
        ;
        (async () => {
            for await (const status of connection.status()) {
                switch (status.type) {
                    case 'reconnect':
                        this.logger.info(`[NATS] Reconnected to ${connection.getServer()}`);
                        this.event.emit('nats:reconnect', { connection });
                        break;
                    case 'disconnect':
                        this.logger.warn(`[NATS] Disconnected from server`);
                        this.event.emit('nats:disconnect', { connection });
                        break;
                    case 'error':
                        this.event.emit('nats:error', { connection, error: status });
                        break;
                }
            }
        })().catch(() => { });
    }
    /**
     * Gracefully drain and close the shared connection.
     */
    async close() {
        if (!this.connection)
            return;
        const connection = this.connection;
        this.connection = undefined;
        try {
            await connection.drain();
        }
        catch {
            await connection.close();
        }
        this.event.emit('nats:disconnect', { connection });
    }
}
exports.default = Connection;
