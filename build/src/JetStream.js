"use strict";
/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jetstream_1 = require("@nats-io/jetstream");
const Request_1 = __importDefault(require("./Context/Request"));
const Response_1 = __importDefault(require("./Context/Response"));
const Message_1 = __importDefault(require("./Context/Message"));
const Helpers_1 = require("./Helpers");
/**
 * JetStream facade: persistent publish (with ack) and consumer registration in
 * the same controller style as core routes. Consumers reuse the shared
 * connection and run the same middleware pipeline as `Router`, with ack/nak
 * controls exposed on `ctx.message`.
 */
class JetStream {
    constructor(app, server, logger, config, connection, dispatcher) {
        this.app = app;
        this.server = server;
        this.logger = logger;
        this.config = config;
        this.connection = connection;
        this.dispatcher = dispatcher;
        this.bindings = [];
    }
    /**
     * The JetStream client (cached), for advanced direct use.
     */
    async client() {
        if (this.js)
            return this.js;
        const nc = await this.connection.use();
        this.js = (0, jetstream_1.jetstream)(nc);
        return this.js;
    }
    /**
     * The JetStream manager (cached), for stream/consumer administration.
     */
    async manager() {
        if (this.jsm)
            return this.jsm;
        const nc = await this.connection.use();
        this.jsm = await (0, jetstream_1.jetstreamManager)(nc);
        return this.jsm;
    }
    /**
     * Persistently publish a message to a stream subject and return the server's
     * acknowledgement. Uses the same `{ body, qs }` envelope as core publishes so
     * the same controllers can read it.
     */
    async publish(subject, body = {}, options = {}) {
        const js = await this.client();
        const payload = JSON.stringify({ body: body || {}, qs: options.qs || {} });
        return js.publish(subject, payload, {
            headers: (0, Helpers_1.buildHeaders)(options.headers || {}),
            ...(options.msgID ? { msgID: options.msgID } : {}),
            ...(options.timeout ? { timeout: options.timeout } : {}),
        });
    }
    /**
     * Register a JetStream consumer bound to a controller action. The consumer is
     * created on startup if it does not already exist.
     */
    consume(options, controller) {
        this.bindings.push({
            options,
            middlewares: this.resolveMiddleware(options.middleware),
            controller,
        });
        return this;
    }
    /**
     * Begin consuming every registered binding. No-op unless JetStream is enabled
     * in config. Called by the provider in server run modes.
     */
    async start() {
        if (!this.config.jetstream.enabled)
            return;
        for (const binding of this.bindings) {
            this.runConsumer(binding).catch((error) => this.logger.error({ err: error }, `[NATS] JetStream consumer crashed for stream ${binding.options.stream}`));
        }
    }
    async runConsumer(binding) {
        const { options } = binding;
        const name = options.durable || options.name;
        await this.ensureConsumer(options);
        const js = await this.client();
        const consumer = await js.consumers.get(options.stream, name);
        const Controller = await this.dispatcher.resolveController(binding.controller);
        const patternForParams = typeof options.filterSubject === 'string' ? options.filterSubject : '';
        const autoAck = options.autoAck !== false;
        const messages = await consumer.consume(options.maxMessages ? { max_messages: options.maxMessages } : undefined);
        this.logger.info(`[NATS] JetStream consumer mapped { ${options.stream}${name ? `/${name}` : ''} }`);
        for await (const msg of messages) {
            const context = {
                config: this.config,
                params: patternForParams ? (0, Helpers_1.parseNatsParams)(msg, patternForParams) : {},
                logger: this.logger,
                routeKey: msg.subject,
            };
            const message = new Message_1.default(msg);
            try {
                context.message = message;
                context.response = new Response_1.default(() => { });
                context.request = new Request_1.default(this.app, context, msg, patternForParams);
                await this.dispatcher.runMiddleware(context, binding.middlewares);
                await Controller(context);
                if (autoAck && !message.settled)
                    msg.ack();
            }
            catch (error) {
                await this.dispatcher.handleException(error, context);
                if (autoAck && !message.settled)
                    msg.nak();
            }
        }
    }
    /**
     * Create the durable consumer if it does not already exist. Streams must
     * already exist (provision them via `node ace nats:sync`); consumers are
     * app-owned and created on demand.
     */
    async ensureConsumer(options) {
        const name = options.durable || options.name;
        if (!name)
            return; // ordered ephemeral consumer — created implicitly by get()
        const jsm = await this.manager();
        try {
            await jsm.consumers.info(options.stream, name);
            return;
        }
        catch {
            // not found — create below
        }
        const cfg = {
            durable_name: name,
            ack_policy: options.ackPolicy || jetstream_1.AckPolicy.Explicit,
        };
        if (Array.isArray(options.filterSubject))
            cfg.filter_subjects = options.filterSubject;
        else if (options.filterSubject)
            cfg.filter_subject = options.filterSubject;
        if (options.deliverPolicy)
            cfg.deliver_policy = options.deliverPolicy;
        if (options.maxDeliver)
            cfg.max_deliver = options.maxDeliver;
        if (options.ackWait)
            cfg.ack_wait = options.ackWait;
        await jsm.consumers.add(options.stream, cfg);
        this.logger.info(`[NATS] Created JetStream consumer ${options.stream}/${name}`);
    }
    resolveMiddleware(names = []) {
        const items = [];
        for (const mid of names) {
            const name = mid.split(':')[0];
            const named = this.server.middleware.getNamed(name);
            if (named) {
                named.args = mid.split(':').length === 2 ? mid.split(':')[1].split('.') : [];
                items.push(named);
            }
            else {
                this.logger.error(`[NATS] cannot find ${name} middleware`);
            }
        }
        return items;
    }
}
exports.default = JetStream;
