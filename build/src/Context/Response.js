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
const nats_core_1 = require("@nats-io/nats-core");
class Response {
    constructor(callback) {
        this.callback = callback;
        this.statusCode = 200;
        this.headers = (0, nats_core_1.headers)();
        this.body = {};
    }
    /**
     * Returns the existing value for a given response header.
     */
    getHeader(key) {
        return this.headers.get(key.toLowerCase());
    }
    /**
     * Get the response headers object.
     */
    getHeaders() {
        return this.headers;
    }
    /**
     * Append a header value. Falsy values are ignored.
     */
    header(key, value) {
        if (value)
            this.headers.append(key.toLowerCase(), String(value));
        return this;
    }
    /**
     * Returns the status code currently set on the response.
     */
    getStatus() {
        return this.statusCode;
    }
    /**
     * Set the response status code. Travels in the `status` header, not the body.
     */
    status(code) {
        this.statusCode = code;
        return this;
    }
    /**
     * Buffer and send the body. The status is appended as a `status` header and
     * the body is JSON-encoded; v3 accepts a string payload directly.
     */
    send(body) {
        this.body = body;
        this.headers.append('status', String(this.statusCode));
        return this.callback({
            body: JSON.stringify(this.body),
            headers: this.headers,
        });
    }
    continue() {
        this.status(100);
        return this.send(null);
    }
    switchingProtocols() {
        this.status(101);
        return this.send(null);
    }
    ok(body) {
        this.status(200);
        return this.send(body);
    }
    created(body) {
        this.status(201);
        return this.send(body);
    }
    accepted(body) {
        this.status(202);
        return this.send(body);
    }
    nonAuthoritativeInformation(body) {
        this.status(203);
        return this.send(body);
    }
    noContent() {
        this.status(204);
        return this.send(null);
    }
    resetContent() {
        this.status(205);
        return this.send(null);
    }
    partialContent(body) {
        this.status(206);
        return this.send(body);
    }
    multipleChoices(body) {
        this.status(300);
        return this.send(body);
    }
    movedPermanently(body) {
        this.status(301);
        return this.send(body);
    }
    movedTemporarily(body) {
        this.status(302);
        return this.send(body);
    }
    seeOther(body) {
        this.status(303);
        return this.send(body);
    }
    notModified(body) {
        this.status(304);
        return this.send(body);
    }
    useProxy(body) {
        this.status(305);
        return this.send(body);
    }
    temporaryRedirect(body) {
        this.status(307);
        return this.send(body);
    }
    badRequest(body) {
        this.status(400);
        return this.send(body);
    }
    unauthorized(body) {
        this.status(401);
        return this.send(body);
    }
    paymentRequired(body) {
        this.status(402);
        return this.send(body);
    }
    forbidden(body) {
        this.status(403);
        return this.send(body);
    }
    notFound(body) {
        this.status(404);
        return this.send(body);
    }
    methodNotAllowed(body) {
        this.status(405);
        return this.send(body);
    }
    notAcceptable(body) {
        this.status(406);
        return this.send(body);
    }
    proxyAuthenticationRequired(body) {
        this.status(407);
        return this.send(body);
    }
    requestTimeout(body) {
        this.status(408);
        return this.send(body);
    }
    conflict(body) {
        this.status(409);
        return this.send(body);
    }
    gone(body) {
        this.status(410);
        return this.send(body);
    }
    lengthRequired(body) {
        this.status(411);
        return this.send(body);
    }
    preconditionFailed(body) {
        this.status(412);
        return this.send(body);
    }
    requestEntityTooLarge(body) {
        this.status(413);
        return this.send(body);
    }
    requestUriTooLong(body) {
        this.status(414);
        return this.send(body);
    }
    unsupportedMediaType(body) {
        this.status(415);
        return this.send(body);
    }
    requestedRangeNotSatisfiable(body) {
        this.status(416);
        return this.send(body);
    }
    expectationFailed(body) {
        this.status(417);
        return this.send(body);
    }
    unprocessableEntity(body) {
        this.status(422);
        return this.send(body);
    }
    tooManyRequests(body) {
        this.status(429);
        return this.send(body);
    }
    internalServerError(body) {
        this.status(500);
        return this.send(body);
    }
    notImplemented(body) {
        this.status(501);
        return this.send(body);
    }
    badGateway(body) {
        this.status(502);
        return this.send(body);
    }
    serviceUnavailable(body) {
        this.status(503);
        return this.send(body);
    }
    gatewayTimeout(body) {
        this.status(504);
        return this.send(body);
    }
    httpVersionNotSupported(body) {
        this.status(505);
        return this.send(body);
    }
}
exports.default = Response;
