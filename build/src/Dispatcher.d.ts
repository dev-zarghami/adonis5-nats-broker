/// <reference types="@adonisjs/application/build/adonis-typings" />
/// <reference types="@adonisjs/http-server/build/adonis-typings" />
/// <reference types="@adonisjs/logger/build/adonis-typings/logger" />
import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
import type { ServerContract } from '@ioc:Adonis/Core/Server';
import type { LoggerContract } from '@ioc:Adonis/Core/Logger';
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker';
/**
 * Shared execution engine for both core routes (`Router`) and JetStream
 * consumers (`JetStream`). It resolves controller/exception handlers from the
 * app's namespaces and runs the middleware pipeline:
 *
 *   global middleware (minus ignored) -> route middleware -> controller
 *
 * Any throw is forwarded to the app's NATS exception handler.
 */
export default class Dispatcher {
    private app;
    private server;
    private logger;
    private config;
    constructor(app: ApplicationContract, server: ServerContract, logger: LoggerContract, config: ConfigContract);
    /**
     * Dynamically import a `Controller.action` handler from a namespace dir and
     * return the action bound to a fresh controller instance.
     */
    importHandler(path: string, handler: string): Promise<Function>;
    /**
     * Resolve a controller action string against the controllers namespace.
     */
    resolveController(controller: string): Promise<Function>;
    /**
     * Resolve the app's NATS exception handler `handle` method.
     */
    resolveExceptionHandler(): Promise<Function>;
    /**
     * Run a single middleware item against the context. Supports both inline
     * function middleware (`Broker.middleware(fn)`) and resolved named/global
     * middleware classes.
     */
    private runMiddlewareItem;
    /**
     * Run the global + route middleware stacks. Global middleware named in
     * `config.ignoreMiddlewares` (e.g. the HTTP BodyParser) are skipped.
     */
    runMiddleware(context: any, routeMiddlewares: any[]): Promise<void>;
    /**
     * Forward an error to the app's NATS exception handler. Best-effort: a
     * failure to even load the handler is logged rather than rethrown into the
     * subscription loop.
     */
    handleException(error: any, context: any): Promise<void>;
}
