import type { JsMsg } from '@nats-io/jetstream';
import type { NatsMessageContract } from '@ioc:Adonis/Addons/NatsJetStream';
/**
 * Wraps a JetStream `JsMsg` and exposes the acknowledgement controls on the
 * NATS context (`ctx.message`). The JetStream consumer loop inspects
 * `settled` to decide whether to auto-ack (handler returned) or auto-nak
 * (handler threw) when the controller did not settle the message itself.
 */
export default class Message implements NatsMessageContract {
    private msg;
    /**
     * True once the controller explicitly acked/naked/termed the message.
     */
    settled: boolean;
    constructor(msg: JsMsg);
    /**
     * Stream sequence of this message.
     */
    get seq(): number;
    /**
     * Whether this delivery is a redelivery.
     */
    get redelivered(): boolean;
    /**
     * How many times this message has been delivered (1 on first delivery).
     */
    get deliveryCount(): number;
    /**
     * Name of the stream the message was stored in.
     */
    get stream(): string;
    /**
     * Name of the consumer that delivered the message.
     */
    get consumer(): string;
    /**
     * The subject the message was published to.
     */
    get subject(): string;
    /**
     * The underlying JetStream message, for advanced use.
     */
    get raw(): JsMsg;
    /**
     * Acknowledge successful processing — the server will not redeliver.
     */
    ack(): void;
    /**
     * Negatively acknowledge — the server will redeliver, optionally after the
     * given delay in milliseconds.
     */
    nak(delay?: number): void;
    /**
     * Terminate — processing failed permanently; the message is not redelivered.
     */
    term(reason?: string): void;
    /**
     * Signal work is still in progress, resetting the ack-wait timer to avoid
     * redelivery of a long-running task. Does not settle the message.
     */
    working(): void;
}
