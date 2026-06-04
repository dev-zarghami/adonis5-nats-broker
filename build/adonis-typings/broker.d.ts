/// <reference types="@adonisjs/http-server/build/adonis-typings" />
declare module '@ioc:Adonis/Addons/NatsBroker' {
    import type { ConnectionOptions, NatsConnection, SubscriptionOptions } from '@nats-io/nats-core';
    import type { ConsumerConfig, StreamConfig } from '@nats-io/jetstream';
    import type { KvOptions } from '@nats-io/kv';
    import type { ObjectStoreOptions } from '@nats-io/obj';
    import type { RouteMiddlewareHandler, RouteHandler } from '@ioc:Adonis/Core/Route';
    import type { NatsRequestOptions, NatsRequestResponse } from '@ioc:Adonis/Addons/NatsRequest';
    /**
     * A middleware spec: a named middleware (`'auth'` / `'auth:web,api'`), an
     * array of them, or an inline middleware function.
     */
    export type NatsMiddleware = RouteMiddlewareHandler | RouteMiddlewareHandler[] | Function;
    /**
     * A single registered route. Middleware can be chained onto it.
     */
    export interface NatsRouteContract {
        middleware(middleware: NatsMiddleware): this;
    }
    /**
     * A group of routes sharing a subject prefix and/or middleware stack.
     */
    export interface NatsRouteGroupContract {
        middleware(middleware: NatsMiddleware): this;
        prefix(prefix: string): this;
    }
    export interface NatsBrokerContract {
        createConnection(): Promise<NatsConnection | Error>;
        closeConnection(): Promise<Error | Boolean>;
        middleware(middleware?: NatsMiddleware): NatsBrokerContract;
        route(pattern: string, handler: RouteHandler): NatsRouteContract;
        group(callback: () => void): NatsRouteGroupContract;
        request(pattern: string, body?: any, options?: NatsRequestOptions): Promise<NatsRequestResponse>;
        publish(pattern: string, body?: object | Uint8Array, options?: NatsRequestOptions): Promise<Error | Boolean>;
    }
    /**
     * A stream declared in config for `node ace nats:sync` to reconcile.
     */
    export type StreamSyncConfig = Partial<StreamConfig> & {
        name: string;
    };
    /**
     * A durable consumer declared in config. `stream` selects the target stream;
     * the remaining fields are the raw JetStream consumer config.
     */
    export type ConsumerSyncConfig = Partial<ConsumerConfig> & {
        stream: string;
    };
    /**
     * A KV bucket declared in config.
     */
    export type KvBucketConfig = Partial<KvOptions> & {
        name: string;
    };
    /**
     * An Object Store bucket declared in config.
     */
    export type ObjectBucketConfig = Partial<ObjectStoreOptions> & {
        name: string;
    };
    export interface ConfigContract {
        /**
         * Process entrypoints (e.g. `server.ts`, `test.ts`) for which the broker
         * opens its connection and starts consuming on boot.
         */
        runModes: string[];
        /**
         * Names of global HTTP middleware to skip for NATS requests (e.g. the
         * BodyParser, which has no role here).
         */
        ignoreMiddlewares: string[];
        /**
         * Auto-generate an `x-request-id` header when one is absent.
         */
        generateRequestId: boolean;
        /**
         * The shared NATS connection options.
         */
        connection: ConnectionOptions;
        namespaces: {
            controllers: string;
            middleware: string;
            exceptions: string;
            exceptionHandler: string;
            listeners: string;
        };
        /**
         * Core (non-JetStream) request/reply and publish behaviour.
         */
        core: {
            routes: {
                options: SubscriptionOptions;
                prefix: string;
            };
            request: {
                timeout: number;
                prefix: string;
                headers: object;
                qs: object;
            };
            publish: {
                prefix: string;
                headers: object;
                qs: object;
            };
        };
        /**
         * JetStream configuration. `streams`/`consumers` are the declarative source
         * of truth reconciled by `node ace nats:sync`.
         */
        jetstream: {
            enabled: boolean;
            domain?: string;
            streams: StreamSyncConfig[];
            consumers: ConsumerSyncConfig[];
        };
        kv: {
            buckets: KvBucketConfig[];
        };
        objectStore: {
            buckets: ObjectBucketConfig[];
        };
    }
    const Broker: NatsBrokerContract;
    export default Broker;
}
