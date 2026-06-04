/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { connect } from '@nats-io/transport-node'
import type { NatsConnection } from '@nats-io/nats-core'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'
import type { EmitterContract } from '@ioc:Adonis/Core/Event'
import type { LoggerContract } from '@ioc:Adonis/Core/Logger'

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
  private connection?: NatsConnection
  private connecting?: Promise<NatsConnection>

  constructor(
    private config: ConfigContract,
    private event: EmitterContract,
    private logger: LoggerContract
  ) {}

  /**
   * Whether the shared connection is currently open.
   */
  public isConnected(): boolean {
    return !!this.connection
  }

  /**
   * The current connection, if any. Prefer `use()` which opens it on demand.
   */
  public current(): NatsConnection | undefined {
    return this.connection
  }

  /**
   * Open (or reuse) the shared connection. Concurrent callers awaiting the
   * first connect share the same in-flight promise.
   */
  public async use(): Promise<NatsConnection> {
    if (this.connection) return this.connection
    if (this.connecting) return this.connecting

    this.connecting = this.open()
    try {
      this.connection = await this.connecting
      return this.connection
    } catch (error) {
      this.event.emit('nats:error', { connection: this.connection as any, error })
      throw error
    } finally {
      this.connecting = undefined
    }
  }

  private async open(): Promise<NatsConnection> {
    const connection = await connect(this.config.connection)
    this.logger.info(`[NATS] Connected to ${connection.getServer()}`)
    this.event.emit('nats:connect', { connection })

    this.monitorStatus(connection)
    connection.closed().then((error) => {
      this.connection = undefined
      if (error) this.logger.error(`[NATS] Connection closed: ${error}`)
      this.event.emit('nats:closed', { connection, error })
    })

    return connection
  }

  /**
   * Forward the connection's reconnect/disconnect lifecycle onto the AdonisJS
   * event emitter so apps can react (e.g. health checks).
   */
  private monitorStatus(connection: NatsConnection): void {
    ;(async () => {
      for await (const status of connection.status()) {
        switch (status.type) {
          case 'reconnect':
            this.logger.info(`[NATS] Reconnected to ${connection.getServer()}`)
            this.event.emit('nats:reconnect', { connection })
            break
          case 'disconnect':
            this.logger.warn(`[NATS] Disconnected from server`)
            this.event.emit('nats:disconnect', { connection })
            break
          case 'error':
            this.event.emit('nats:error', { connection, error: status })
            break
        }
      }
    })().catch(() => {})
  }

  /**
   * Gracefully drain and close the shared connection.
   */
  public async close(): Promise<void> {
    if (!this.connection) return
    const connection = this.connection
    this.connection = undefined
    try {
      await connection.drain()
    } catch {
      await connection.close()
    }
    this.event.emit('nats:disconnect', { connection })
  }
}
