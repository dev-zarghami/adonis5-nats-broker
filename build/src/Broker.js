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
/**
 * Thin facade over the core NATS pieces. Connection lifecycle is delegated to
 * `Connection`, routing to `Router`, and outbound calls to `Client`. JetStream,
 * KV, and Object Store are exposed through their own container bindings.
 */
class Broker {
    constructor(connection, router, client) {
        this.connection = connection;
        this.router = router;
        this.client = client;
    }
    /**
     * Open the shared connection and start consuming the registered routes.
     * Called by the provider in server run modes.
     */
    async createConnection() {
        try {
            const connection = await this.connection.use();
            await this.router.start();
            return connection;
        }
        catch (error) {
            return new Error(String(error));
        }
    }
    /**
     * Drain and close the shared connection.
     */
    async closeConnection() {
        try {
            await this.connection.close();
            return true;
        }
        catch (error) {
            return new Error(String(error));
        }
    }
    /**
     * Set (or clear) the active middleware stack for subsequent `route()` calls.
     */
    middleware(middleware) {
        this.router.middleware(middleware);
        return this;
    }
    /**
     * Register a core request/reply route bound to a controller action. Returns
     * the route so middleware can be chained: `route(...).middleware('auth')`.
     */
    route(pattern, handler) {
        return this.router.route(pattern, handler);
    }
    /**
     * Group routes under a shared subject prefix and/or middleware stack. Set the
     * group's prefix/middleware fluently on the returned group:
     * `group(() => { ... }).prefix('admin').middleware('auth')`.
     */
    group(callback) {
        return this.router.group(callback);
    }
    /**
     * Send a request and await the reply.
     */
    request(pattern, body, options) {
        return this.client.request(pattern, body, options);
    }
    /**
     * Publish a message without waiting for a reply.
     */
    publish(pattern, body, options) {
        return this.client.publish(pattern, body, options);
    }
}
exports.default = Broker;
