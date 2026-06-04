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
const Helpers_1 = require("../Helpers");
class Request {
    constructor(app, ctx, message, pattern) {
        this.app = app;
        this.ctx = ctx;
        this.requestHeaders = (0, Helpers_1.parseNatsHeaders)(message);
        this.requestBody = (0, Helpers_1.parseNatsBody)(message);
        this.routeParams = (0, Helpers_1.parseNatsParams)(message, pattern);
        this.requestQs = (0, Helpers_1.parseNatsQs)(message);
        this.routeKey = message.subject;
    }
    async validate(model) {
        const { validator } = this.app.container.use('Adonis/Core/Validator');
        let payload = {};
        if (typeof model === 'function') {
            // @ts-ignore - validator class shape resolved at runtime
            const instance = new model(this.ctx);
            payload = await validator.validate({ data: this.requestBody, ...instance });
        }
        else if (typeof model === 'object') {
            payload = await validator.validate({ data: this.requestBody, ...model });
        }
        return payload;
    }
    /**
     * Returns the request id from the `x-request-id` header. The header is
     * generated (when enabled in config) and appended if it does not exist.
     */
    id() {
        let requestId = this.header('x-request-id', '');
        if (!requestId && this.ctx.config.generateRequestId) {
            const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            requestId = `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
            this.requestHeaders.append('x-request-id', requestId);
        }
        return requestId;
    }
    /**
     * Replace the request body. `all()` is recomputed from the new body.
     */
    updateBody(body) {
        this.requestBody = body;
    }
    /**
     * Replace the query string. `all()` is recomputed from the new query.
     */
    updateQs(data) {
        this.requestQs = data;
    }
    /**
     * Replace the route params.
     */
    updateParams(data) {
        this.routeParams = data;
    }
    /**
     * Bind an arbitrary value onto the request (e.g. an authenticated user).
     * Reserved keys cannot be overwritten.
     */
    set(key, value) {
        if (!this[key])
            this[key] = value;
        else
            return new Error('This name is among the reserved names');
    }
    /**
     * Read a value previously bound with `set`.
     */
    get(key) {
        return this[key];
    }
    params() {
        return this.routeParams;
    }
    qs() {
        return this.requestQs;
    }
    body() {
        return this.requestBody;
    }
    /**
     * Merged view of body, query string, and route params.
     */
    all() {
        return { ...this.requestBody, ...this.requestQs, ...this.routeParams };
    }
    /**
     * Read a value from the merged body + query string, with optional default.
     */
    input(key, defaultValue) {
        const mergedData = { ...this.requestBody, ...this.requestQs };
        return typeof mergedData[key] !== 'undefined' ? mergedData[key] : defaultValue;
    }
    /**
     * Read a route param, with optional default.
     */
    param(key, defaultValue) {
        return typeof this.routeParams[key] !== 'undefined' ? this.routeParams[key] : defaultValue;
    }
    /**
     * Returns a copy of headers as a plain object.
     */
    headers() {
        const data = {};
        for (const key of this.requestHeaders.keys()) {
            data[key] = this.requestHeaders.get(key);
        }
        return data;
    }
    /**
     * Read a single header value, with optional default.
     */
    header(key, defaultValue) {
        return this.requestHeaders.has(key) ? this.requestHeaders.get(key) : defaultValue;
    }
}
exports.default = Request;
