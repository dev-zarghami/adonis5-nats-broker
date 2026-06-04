/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { JsMsg } from '@nats-io/jetstream'
import type { NatsMessageContract } from '@ioc:Adonis/Addons/NatsJetStream'

/**
 * Wraps a JetStream `JsMsg` and exposes the acknowledgement controls on the
 * NATS context (`ctx.message`). The JetStream consumer loop inspects
 * `settled` to decide whether to auto-ack (handler returned) or auto-nak
 * (handler threw) when the controller did not settle the message itself.
 */
export default class Message implements NatsMessageContract {
  /**
   * True once the controller explicitly acked/naked/termed the message.
   */
  public settled = false

  constructor(private msg: JsMsg) {}

  /**
   * Stream sequence of this message.
   */
  public get seq(): number {
    return this.msg.seq
  }

  /**
   * Whether this delivery is a redelivery.
   */
  public get redelivered(): boolean {
    return this.msg.redelivered
  }

  /**
   * How many times this message has been delivered (1 on first delivery).
   */
  public get deliveryCount(): number {
    return this.msg.info.deliveryCount
  }

  /**
   * Name of the stream the message was stored in.
   */
  public get stream(): string {
    return this.msg.info.stream
  }

  /**
   * Name of the consumer that delivered the message.
   */
  public get consumer(): string {
    return this.msg.info.consumer
  }

  /**
   * The subject the message was published to.
   */
  public get subject(): string {
    return this.msg.subject
  }

  /**
   * The underlying JetStream message, for advanced use.
   */
  public get raw(): JsMsg {
    return this.msg
  }

  /**
   * Acknowledge successful processing — the server will not redeliver.
   */
  public ack(): void {
    this.settled = true
    this.msg.ack()
  }

  /**
   * Negatively acknowledge — the server will redeliver, optionally after the
   * given delay in milliseconds.
   */
  public nak(delay?: number): void {
    this.settled = true
    this.msg.nak(delay)
  }

  /**
   * Terminate — processing failed permanently; the message is not redelivered.
   */
  public term(reason?: string): void {
    this.settled = true
    this.msg.term(reason)
  }

  /**
   * Signal work is still in progress, resetting the ack-wait timer to avoid
   * redelivery of a long-running task. Does not settle the message.
   */
  public working(): void {
    this.msg.working()
  }
}
