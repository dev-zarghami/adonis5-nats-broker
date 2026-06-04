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
const Helpers_1 = require("./Helpers");
/**
 * Outbound NATS client: `request()` (request/reply) and `publish()`
 * (fire-and-forget). Unlike v1 — which opened and closed a fresh connection on
 * every call — both reuse the single shared connection. A request may still
 * target a different server by passing `options.servers`, in which case a
 * dedicated short-lived connection is opened just for that call.
 */
class Client {
    constructor(app, config, connection) {
        this.app = app;
        this.config = config;
        this.connection = connection;
    }
    validatorSchema() {
        const { schema } = this.app.container.use('Adonis/Core/Validator');
        return schema.create({
            timeout: schema.number.optional(),
            qs: schema.object.optional().anyMembers(),
            body: schema.object().anyMembers(),
            headers: schema.object.optional().anyMembers(),
            servers: schema.string.optional(),
        });
    }
    async validate(body, options) {
        const { validator } = this.app.container.use('Adonis/Core/Validator');
        return validator.validate({
            data: Object.assign({ body }, options),
            schema: this.validatorSchema(),
        });
    }
    /**
     * Send a request and await the reply. Always resolves with the response —
     * inspect `response.headers.status` to handle non-2xx replies.
     */
    async request(pattern, body = {}, options = {}) {
        const mixedPattern = (0, Helpers_1.prefixPattern)(this.config.core.request.prefix, pattern);
        const payload = await this.validate(body, options);
        const mixedHeaders = Object.assign({}, this.config.core.request.headers, payload.headers);
        const hdrs = (0, Helpers_1.buildHeaders)(mixedHeaders);
        const Payload = JSON.stringify({
            body: payload.body || {},
            qs: Object.assign({}, this.config.core.request.qs, payload.qs),
        });
        const timeout = payload.timeout || this.config.core.request.timeout;
        // Reuse the shared connection unless a one-off server target was requested.
        const dedicated = payload.servers
            ? await (0, transport_node_1.connect)({ servers: payload.servers, name: this.config.connection.name })
            : undefined;
        const connection = dedicated || (await this.connection.use());
        try {
            const response = await connection.request(mixedPattern, Payload, { timeout, headers: hdrs });
            const responseHeaders = (0, Helpers_1.headersToObject)(response.headers);
            responseHeaders.status = Number(responseHeaders.status);
            const decoded = response.string();
            let parsedData;
            try {
                parsedData = JSON.parse(decoded);
            }
            catch {
                parsedData = decoded;
            }
            return {
                headers: responseHeaders,
                body: parsedData,
                request: {
                    servers: payload.servers || this.config.connection.servers,
                    timeout,
                    payload: JSON.parse(Payload),
                    headers: mixedHeaders,
                    name: this.config.connection.name,
                    url: mixedPattern,
                },
            };
        }
        finally {
            if (dedicated)
                await dedicated.close();
        }
    }
    /**
     * Publish a message without waiting for a reply.
     */
    async publish(pattern, body = {}, options = {}) {
        const mixedPattern = (0, Helpers_1.prefixPattern)(this.config.core.publish.prefix, pattern);
        const payload = await this.validate(body, options);
        const mixedHeaders = Object.assign({}, this.config.core.publish.headers, payload.headers);
        const hdrs = (0, Helpers_1.buildHeaders)(mixedHeaders);
        const Payload = JSON.stringify({
            body: payload.body || {},
            qs: Object.assign({}, this.config.core.publish.qs, payload.qs),
        });
        const connection = await this.connection.use();
        connection.publish(mixedPattern, Payload, { headers: hdrs });
        await connection.flush();
        return true;
    }
}
exports.default = Client;
