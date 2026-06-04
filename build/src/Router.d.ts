/// <reference types="@adonisjs/application/build/adonis-typings" />
/// <reference types="@adonisjs/http-server/build/adonis-typings" />
/// <reference types="@adonisjs/logger/build/adonis-typings/logger" />
import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
import type { ServerContract } from '@ioc:Adonis/Core/Server';
import type { LoggerContract } from '@ioc:Adonis/Core/Logger';
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker';
import type Connection from './Connection';
import type Dispatcher from './Dispatcher';
import Route from './Route';
import RouteGroup from './RouteGroup';
/**
 * Owns the core NATS route registry and the request/reply subscription loop.
 *
 * Routes can be declared three ways, which compose:
 *  - the stateful `middleware()` stack (applied to subsequent `route()` calls),
 *  - per-route `route(...).middleware(...)`,
 *  - and `group(callback).prefix(...).middleware(...)` for shared prefix/stack.
 *
 * Prefixes and middleware are resolved and composed once, at `start()`.
 */
export default class Router {
    private app;
    private server;
    private logger;
    private config;
    private connection;
    private dispatcher;
    private activeMiddleware;
    private currentGroup;
    private readonly tree;
    constructor(app: ApplicationContract, server: ServerContract, logger: LoggerContract, config: ConfigContract, connection: Connection, dispatcher: Dispatcher);
    /**
     * Set (or clear) the stateful middleware stack applied to every subsequent
     * `route()` call. Call with no args to clear. Accepts named middleware
     * (`'auth:web,api'`), arrays, or inline functions.
     */
    middleware(middleware?: any): this;
    /**
     * Register a route, seeded with the active stateful middleware stack. Returns
     * the `Route` so middleware can be chained: `route(...).middleware('auth')`.
     */
    route(pattern: string, handler: string): Route;
    /**
     * Group routes (and nested groups) under a shared prefix/middleware stack.
     * Routes declared inside `callback` belong to the group; set the group's
     * prefix/middleware fluently on the returned `RouteGroup`.
     */
    group(callback: () => void): RouteGroup;
    private attach;
    /**
     * Subscribe every registered route on the shared connection and begin
     * consuming. Called once the connection is ready (server run mode).
     */
    start(): Promise<void>;
    /**
     * Flatten the route/group tree into concrete routes, composing each route's
     * subject prefix and middleware stack from its enclosing groups.
     */
    private resolveRoutes;
    /**
     * Resolve raw middleware specs (names / arrays / functions) into runnable
     * middleware items, preserving order.
     */
    private resolveMiddleware;
    private consume;
    private logMapped;
}
