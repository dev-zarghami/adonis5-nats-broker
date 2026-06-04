declare module '@ioc:Adonis/Addons/NatsJetStream' {
    import type { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, JsMsg, PubAck } from '@nats-io/jetstream';
    /**
     * Acknowledgement controls exposed on the NATS context as `ctx.message` while
     * processing a JetStream delivery.
     */
    export interface NatsMessageContract {
        /**
         * True once the controller explicitly settled (ack/nak/term) the message.
         */
        settled: boolean;
        /**
         * Stream sequence of this message.
         */
        seq: number;
        /**
         * Whether this delivery is a redelivery.
         */
        redelivered: boolean;
        /**
         * Number of times this message has been delivered (1 on first delivery).
         */
        deliveryCount: number;
        /**
         * Name of the stream the message was stored in.
         */
        stream: string;
        /**
         * Name of the consumer that delivered the message.
         */
        consumer: string;
        /**
         * The subject the message was published to.
         */
        subject: string;
        /**
         * The underlying JetStream message, for advanced use.
         */
        raw: JsMsg;
        /**
         * Acknowledge successful processing.
         */
        ack(): void;
        /**
         * Negatively acknowledge — redeliver, optionally after `delay` ms.
         */
        nak(delay?: number): void;
        /**
         * Terminate — do not redeliver.
         */
        term(reason?: string): void;
        /**
         * Signal work in progress, resetting the ack-wait timer.
         */
        working(): void;
    }
    /**
     * Options for registering a JetStream consumer.
     */
    export interface NatsConsumeOptions {
        /**
         * The stream to consume from.
         */
        stream: string;
        /**
         * Durable consumer name. Created on startup if it does not exist.
         */
        durable?: string;
        /**
         * Alias for `durable` when binding to a named (possibly pre-created)
         * consumer.
         */
        name?: string;
        /**
         * Restrict delivery to one or more subjects within the stream.
         */
        filterSubject?: string | string[];
        /**
         * Named middleware to run before the controller (e.g. `'auth:web'`).
         */
        middleware?: string[];
        /**
         * Acknowledgement policy. Defaults to explicit ack.
         */
        ackPolicy?: AckPolicy;
        /**
         * Where to start delivering from.
         */
        deliverPolicy?: DeliverPolicy;
        /**
         * Max delivery attempts before the message is dead-lettered by the server.
         */
        maxDeliver?: number;
        /**
         * Ack wait in nanoseconds before redelivery.
         */
        ackWait?: number;
        /**
         * Max in-flight messages pulled at a time.
         */
        maxMessages?: number;
        /**
         * Auto-ack on a clean return / auto-nak on throw, unless the controller
         * already settled the message. Defaults to `true`.
         */
        autoAck?: boolean;
    }
    /**
     * Options for a JetStream publish.
     */
    export interface NatsJetStreamPublishOptions {
        headers?: object;
        qs?: object;
        /**
         * Dedup id honoured within the stream's duplicate window.
         */
        msgID?: string;
        /**
         * Publish ack timeout in milliseconds.
         */
        timeout?: number;
    }
    export interface NatsJetStreamContract {
        client(): Promise<JetStreamClient>;
        manager(): Promise<JetStreamManager>;
        publish(subject: string, body?: object, options?: NatsJetStreamPublishOptions): Promise<PubAck>;
        consume(options: NatsConsumeOptions, controller: string): NatsJetStreamContract;
    }
    const JetStream: NatsJetStreamContract;
    export default JetStream;
}
