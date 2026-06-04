import type { NatsConnection } from '@nats-io/nats-core';
import type { NatsBrokerContract } from '@ioc:Adonis/Addons/NatsBroker';
import type { NatsRequestOptions, NatsRequestResponse } from '@ioc:Adonis/Addons/NatsRequest';
import type Connection from './Connection';
import type Router from './Router';
import type Client from './Client';
import type Route from './Route';
import type RouteGroup from './RouteGroup';
/**
 * Thin facade over the core NATS pieces. Connection lifecycle is delegated to
 * `Connection`, routing to `Router`, and outbound calls to `Client`. JetStream,
 * KV, and Object Store are exposed through their own container bindings.
 */
export default class Broker implements NatsBrokerContract {
    private connection;
    private router;
    private client;
    constructor(connection: Connection, router: Router, client: Client);
    /**
     * Open the shared connection and start consuming the registered routes.
     * Called by the provider in server run modes.
     */
    createConnection(): Promise<NatsConnection | Error>;
    /**
     * Drain and close the shared connection.
     */
    closeConnection(): Promise<Error | Boolean>;
    /**
     * Set (or clear) the active middleware stack for subsequent `route()` calls.
     */
    middleware(middleware?: any): this;
    /**
     * Register a core request/reply route bound to a controller action. Returns
     * the route so middleware can be chained: `route(...).middleware('auth')`.
     */
    route(pattern: string, handler: string): Route;
    /**
     * Group routes under a shared subject prefix and/or middleware stack. Set the
     * group's prefix/middleware fluently on the returned group:
     * `group(() => { ... }).prefix('admin').middleware('auth')`.
     */
    group(callback: () => void): RouteGroup;
    /**
     * Send a request and await the reply.
     */
    request(pattern: string, body?: object, options?: NatsRequestOptions): Promise<NatsRequestResponse>;
    /**
     * Publish a message without waiting for a reply.
     */
    publish(pattern: string, body?: object, options?: NatsRequestOptions): Promise<Error | Boolean>;
}
