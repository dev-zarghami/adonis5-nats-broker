import type { MsgHdrs } from '@nats-io/nats-core';
import type { NatsResponseContract } from '@ioc:Adonis/Addons/NatsResponse';
/**
 * The callback that actually delivers the buffered response over NATS. For a
 * core request/reply route this calls `msg.respond(...)`; for a JetStream
 * consumer with no reply subject it is a no-op.
 */
export type ResponderCallback = (response: {
    body: string;
    headers: MsgHdrs;
}) => void;
export default class Response implements NatsResponseContract {
    protected callback: ResponderCallback;
    private statusCode;
    private readonly headers;
    private body;
    constructor(callback: ResponderCallback);
    /**
     * Returns the existing value for a given response header.
     */
    getHeader(key: string): string;
    /**
     * Get the response headers object.
     */
    getHeaders(): any;
    /**
     * Append a header value. Falsy values are ignored.
     */
    header(key: string, value: any): this;
    /**
     * Returns the status code currently set on the response.
     */
    getStatus(): number;
    /**
     * Set the response status code. Travels in the `status` header, not the body.
     */
    status(code: number): this;
    /**
     * Buffer and send the body. The status is appended as a `status` header and
     * the body is JSON-encoded; v3 accepts a string payload directly.
     */
    send(body: any): void;
    continue(): void;
    switchingProtocols(): void;
    ok(body: any): void;
    created(body?: any): void;
    accepted(body: any): void;
    nonAuthoritativeInformation(body: any): void;
    noContent(): void;
    resetContent(): void;
    partialContent(body: any): void;
    multipleChoices(body?: any): void;
    movedPermanently(body?: any): void;
    movedTemporarily(body?: any): void;
    seeOther(body?: any): void;
    notModified(body?: any): void;
    useProxy(body?: any): void;
    temporaryRedirect(body?: any): void;
    badRequest(body?: any): void;
    unauthorized(body?: any): void;
    paymentRequired(body?: any): void;
    forbidden(body?: any): void;
    notFound(body?: any): void;
    methodNotAllowed(body?: any): void;
    notAcceptable(body?: any): void;
    proxyAuthenticationRequired(body?: any): void;
    requestTimeout(body?: any): void;
    conflict(body?: any): void;
    gone(body?: any): void;
    lengthRequired(body?: any): void;
    preconditionFailed(body?: any): void;
    requestEntityTooLarge(body?: any): void;
    requestUriTooLong(body?: any): void;
    unsupportedMediaType(body?: any): void;
    requestedRangeNotSatisfiable(body?: any): void;
    expectationFailed(body?: any): void;
    unprocessableEntity(body?: any): void;
    tooManyRequests(body?: any): void;
    internalServerError(body?: any): void;
    notImplemented(body?: any): void;
    badGateway(body?: any): void;
    serviceUnavailable(body?: any): void;
    gatewayTimeout(body?: any): void;
    httpVersionNotSupported(body?: any): void;
}
