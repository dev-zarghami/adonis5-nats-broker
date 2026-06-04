/// <reference types="@adonisjs/http-server/build/adonis-typings" />
declare module '@ioc:Adonis/Addons/NatsResponse' {
    import type { CastableHeader } from '@ioc:Adonis/Core/Response';
    export interface NatsResponseContract {
        /**
         * Returns the existing value for a given NATS response
         * header.
         */
        getHeader(key: string): string | string[] | number | undefined;
        /**
         * Get headers
         */
        getHeaders(): {
            [key: string]: string | string[] | number;
        };
        /**
         * Set header on the response. To `append` values to the existing header, we suggest
         * using [[append]] method.
         *
         * If `value` is non existy, then header won't be set.
         *
         * @example
         * ```js
         * response.header('content-type', 'application/json')
         * ```
         */
        header(key: string, value: CastableHeader): this;
        /**
         * Get the current status for the response
         */
        getStatus(): number;
        /**
         * Set NATS status code
         */
        status(code: number): this;
        /**
         * Send the body as response and optionally generate etag. The default value
         * is read from `config/app.js` file, using `http.etag` property.
         *
         * This method buffers the body if `explicitEnd = true`, which is the default
         * behavior and do not change, unless you know what you are doing.
         */
        send(body: any): void;
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
    const NatsResponse: NatsResponseContract;
    export default NatsResponse;
}
