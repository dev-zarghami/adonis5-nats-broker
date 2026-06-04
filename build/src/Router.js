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
const Route_1 = __importDefault(require("./Route"));
const RouteGroup_1 = __importDefault(require("./RouteGroup"));
const Request_1 = __importDefault(require("./Context/Request"));
const Response_1 = __importDefault(require("./Context/Response"));
const Helpers_1 = require("./Helpers");
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
class Router {
    constructor(app, server, logger, config, connection, dispatcher) {
        this.app = app;
        this.server = server;
        this.logger = logger;
        this.config = config;
        this.connection = connection;
        this.dispatcher = dispatcher;
        this.activeMiddleware = [];
        this.currentGroup = null;
        this.tree = [];
    }
    /**
     * Set (or clear) the stateful middleware stack applied to every subsequent
     * `route()` call. Call with no args to clear. Accepts named middleware
     * (`'auth:web,api'`), arrays, or inline functions.
     */
    middleware(middleware) {
        this.activeMiddleware = middleware
            ? Array.isArray(middleware)
                ? middleware
                : [middleware]
            : [];
        return this;
    }
    /**
     * Register a route, seeded with the active stateful middleware stack. Returns
     * the `Route` so middleware can be chained: `route(...).middleware('auth')`.
     */
    route(pattern, handler) {
        const route = new Route_1.default(pattern, handler, this.currentGroup, this.activeMiddleware);
        this.attach(route);
        return route;
    }
    /**
     * Group routes (and nested groups) under a shared prefix/middleware stack.
     * Routes declared inside `callback` belong to the group; set the group's
     * prefix/middleware fluently on the returned `RouteGroup`.
     */
    group(callback) {
        const group = new RouteGroup_1.default(this.currentGroup);
        const parent = this.currentGroup;
        this.currentGroup = group;
        try {
            callback();
        }
        finally {
            this.currentGroup = parent;
        }
        this.attach(group);
        return group;
    }
    attach(node) {
        if (this.currentGroup)
            this.currentGroup.children.push(node);
        else
            this.tree.push(node);
    }
    /**
     * Subscribe every registered route on the shared connection and begin
     * consuming. Called once the connection is ready (server run mode).
     */
    async start() {
        const connection = await this.connection.use();
        for (const resolved of this.resolveRoutes()) {
            const subject = (0, Helpers_1.createSubject)(resolved.pattern);
            const subscription = connection.subscribe(subject, this.config.core.routes.options);
            this.consume(subscription, resolved).catch((error) => this.logger.error({ err: error }, `[NATS] subscription loop crashed for ${subject}`));
            this.logMapped(resolved);
        }
    }
    /**
     * Flatten the route/group tree into concrete routes, composing each route's
     * subject prefix and middleware stack from its enclosing groups.
     */
    resolveRoutes() {
        const out = [];
        const walk = (node, prefixes, middleware) => {
            if (node instanceof RouteGroup_1.default) {
                const nextPrefixes = node.groupPrefix ? [...prefixes, node.groupPrefix] : prefixes;
                const nextMiddleware = [...middleware, ...node.ownMiddleware];
                for (const child of node.children)
                    walk(child, nextPrefixes, nextMiddleware);
                return;
            }
            const parts = [this.config.core.routes.prefix, ...prefixes, node.pattern];
            out.push({
                pattern: parts.filter((part) => part && part.length).join('.'),
                middlewares: this.resolveMiddleware([...middleware, ...node.ownMiddleware]),
                controller: node.handler,
            });
        };
        for (const node of this.tree)
            walk(node, [], []);
        return out;
    }
    /**
     * Resolve raw middleware specs (names / arrays / functions) into runnable
     * middleware items, preserving order.
     */
    resolveMiddleware(specs) {
        const items = [];
        for (const spec of specs) {
            for (const mid of Array.isArray(spec) ? spec : [spec]) {
                if (typeof mid === 'function') {
                    items.push({ type: 'function', value: mid, args: [] });
                    continue;
                }
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
        }
        return items;
    }
    async consume(subscription, route) {
        const Controller = await this.dispatcher.resolveController(route.controller);
        for await (const msg of subscription) {
            const context = {
                config: this.config,
                params: (0, Helpers_1.parseNatsParams)(msg, route.pattern),
                logger: this.logger,
                routeKey: msg.subject,
            };
            try {
                context.response = new Response_1.default((response) => msg.respond(response.body, { headers: response.headers }));
                context.request = new Request_1.default(this.app, context, msg, route.pattern);
                await this.dispatcher.runMiddleware(context, route.middlewares);
                await Controller(context);
            }
            catch (error) {
                await this.dispatcher.handleException(error, context);
            }
        }
    }
    logMapped(route) {
        const names = route.middlewares.length
            ? ` Middlewares: [${route.middlewares
                .map((m) => m.type === 'function' ? m.value.name || 'fn' : m.value?.name || m.name || '')
                .join(', ')}]`
            : '';
        this.logger.info(`[NATS] RouteExplorer mapped { ${route.pattern} }${names}`);
    }
}
exports.default = Router;
