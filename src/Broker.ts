/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { NatsConnection } from '@nats-io/nats-core'
import type { NatsBrokerContract } from '@ioc:Adonis/Addons/NatsBroker'
import type { NatsRequestOptions, NatsRequestResponse } from '@ioc:Adonis/Addons/NatsRequest'
import type Connection from './Connection'
import type Router from './Router'
import type Client from './Client'
import type Route from './Route'
import type RouteGroup from './RouteGroup'

/**
 * Thin facade over the core NATS pieces. Connection lifecycle is delegated to
 * `Connection`, routing to `Router`, and outbound calls to `Client`. JetStream,
 * KV, and Object Store are exposed through their own container bindings.
 */
export default class Broker implements NatsBrokerContract {
  constructor(private connection: Connection, private router: Router, private client: Client) {}

  /**
   * Open the shared connection and start consuming the registered routes.
   * Called by the provider in server run modes.
   */
  public async createConnection(): Promise<NatsConnection | Error> {
    try {
      const connection = await this.connection.use()
      await this.router.start()
      return connection
    } catch (error) {
      return new Error(String(error))
    }
  }

  /**
   * Drain and close the shared connection.
   */
  public async closeConnection(): Promise<Error | Boolean> {
    try {
      await this.connection.close()
      return true
    } catch (error) {
      return new Error(String(error))
    }
  }

  /**
   * Set (or clear) the active middleware stack for subsequent `route()` calls.
   */
  public middleware(middleware?: any): this {
    this.router.middleware(middleware)
    return this
  }

  /**
   * Register a core request/reply route bound to a controller action. Returns
   * the route so middleware can be chained: `route(...).middleware('auth')`.
   */
  public route(pattern: string, handler: string): Route {
    return this.router.route(pattern, handler)
  }

  /**
   * Group routes under a shared subject prefix and/or middleware stack. Set the
   * group's prefix/middleware fluently on the returned group:
   * `group(() => { ... }).prefix('admin').middleware('auth')`.
   */
  public group(callback: () => void): RouteGroup {
    return this.router.group(callback)
  }

  /**
   * Send a request and await the reply.
   */
  public request(
    pattern: string,
    body?: object,
    options?: NatsRequestOptions
  ): Promise<NatsRequestResponse> {
    return this.client.request(pattern, body, options)
  }

  /**
   * Publish a message without waiting for a reply.
   */
  public publish(
    pattern: string,
    body?: object,
    options?: NatsRequestOptions
  ): Promise<Error | Boolean> {
    return this.client.publish(pattern, body, options)
  }
}
