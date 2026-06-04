/// <reference types="@adonisjs/application/build/adonis-typings" />
import type { Msg, MsgHdrs } from '@nats-io/nats-core';
import type { JsMsg } from '@nats-io/jetstream';
import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
import type { NatsRequestContract } from '@ioc:Adonis/Addons/NatsRequest';
export default class Request implements NatsRequestContract {
    protected app: ApplicationContract;
    ctx: any;
    requestHeaders: MsgHdrs;
    requestBody: Record<string, any>;
    routeParams: Record<string, any>;
    requestQs: Record<string, any>;
    routeKey: string;
    constructor(app: ApplicationContract, ctx: any, message: Msg | JsMsg, pattern: string);
    validate(model: Function | Object): Promise<any>;
    /**
     * Returns the request id from the `x-request-id` header. The header is
     * generated (when enabled in config) and appended if it does not exist.
     */
    id(): string | undefined;
    /**
     * Replace the request body. `all()` is recomputed from the new body.
     */
    updateBody(body: Record<string, any>): void;
    /**
     * Replace the query string. `all()` is recomputed from the new query.
     */
    updateQs(data: Record<string, any>): void;
    /**
     * Replace the route params.
     */
    updateParams(data: Record<string, any>): void;
    /**
     * Bind an arbitrary value onto the request (e.g. an authenticated user).
     * Reserved keys cannot be overwritten.
     */
    set(key: string, value: any): Error | undefined;
    /**
     * Read a value previously bound with `set`.
     */
    get(key: string): any;
    params(): Record<string, any>;
    qs(): Record<string, any>;
    body(): Record<string, any>;
    /**
     * Merged view of body, query string, and route params.
     */
    all(): Record<string, any>;
    /**
     * Read a value from the merged body + query string, with optional default.
     */
    input(key: string, defaultValue?: any): any;
    /**
     * Read a route param, with optional default.
     */
    param(key: string, defaultValue?: any): any;
    /**
     * Returns a copy of headers as a plain object.
     */
    headers(): object;
    /**
     * Read a single header value, with optional default.
     */
    header(key: string, defaultValue?: any): any;
}
