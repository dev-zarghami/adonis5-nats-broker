/// <reference types="@adonisjs/application/build/adonis-typings" />
import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker';
import type { NatsRequestOptions, NatsRequestResponse } from '@ioc:Adonis/Addons/NatsRequest';
import type Connection from './Connection';
/**
 * Outbound NATS client: `request()` (request/reply) and `publish()`
 * (fire-and-forget). Unlike v1 — which opened and closed a fresh connection on
 * every call — both reuse the single shared connection. A request may still
 * target a different server by passing `options.servers`, in which case a
 * dedicated short-lived connection is opened just for that call.
 */
export default class Client {
    private app;
    private config;
    private connection;
    constructor(app: ApplicationContract, config: ConfigContract, connection: Connection);
    private validatorSchema;
    private validate;
    /**
     * Send a request and await the reply. Always resolves with the response —
     * inspect `response.headers.status` to handle non-2xx replies.
     */
    request(pattern: string, body?: object, options?: NatsRequestOptions): Promise<NatsRequestResponse>;
    /**
     * Publish a message without waiting for a reply.
     */
    publish(pattern: string, body?: object, options?: NatsRequestOptions): Promise<Boolean | Error>;
}
