"use strict";
/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
/**
 * Shared execution engine for both core routes (`Router`) and JetStream
 * consumers (`JetStream`). It resolves controller/exception handlers from the
 * app's namespaces and runs the middleware pipeline:
 *
 *   global middleware (minus ignored) -> route middleware -> controller
 *
 * Any throw is forwarded to the app's NATS exception handler.
 */
class Dispatcher {
    constructor(app, server, logger, config) {
        this.app = app;
        this.server = server;
        this.logger = logger;
        this.config = config;
    }
    /**
     * Dynamically import a `Controller.action` handler from a namespace dir and
     * return the action bound to a fresh controller instance.
     */
    async importHandler(path, handler) {
        const parts = handler.split('.');
        const file = parts.length === 2 ? parts[0] : '';
        const action = parts.length === 2 ? parts[1] : handler;
        const fullPath = (0, path_1.join)(path, file);
        try {
            const { default: Handler } = await Promise.resolve(`${fullPath}`).then(s => __importStar(require(s)));
            const instance = new Handler();
            return instance[action].bind(instance);
        }
        catch (error) {
            this.logger.error(`[NATS] Cannot load file at path: ${fullPath}. Ensure the file exists.`);
            throw error;
        }
    }
    /**
     * Resolve a controller action string against the controllers namespace.
     */
    resolveController(controller) {
        return this.importHandler((0, path_1.join)(this.app.appRoot, this.config.namespaces.controllers), controller);
    }
    /**
     * Resolve the app's NATS exception handler `handle` method.
     */
    resolveExceptionHandler() {
        return this.importHandler((0, path_1.join)(this.app.appRoot, this.config.namespaces.exceptionHandler), 'handle');
    }
    /**
     * Run a single middleware item against the context. Supports both inline
     * function middleware (`Broker.middleware(fn)`) and resolved named/global
     * middleware classes.
     */
    async runMiddlewareItem(item, context) {
        if (item.type === 'function') {
            await item.value(context, async () => true, item.args);
            return;
        }
        const { default: Middleware } = await item.value();
        const instance = new Middleware();
        await instance.handle(context, async () => true, item.args);
    }
    /**
     * Run the global + route middleware stacks. Global middleware named in
     * `config.ignoreMiddlewares` (e.g. the HTTP BodyParser) are skipped.
     */
    async runMiddleware(context, routeMiddlewares) {
        for (const item of this.server.middleware.get()) {
            const { default: Middleware } = await item.value();
            if (!this.config.ignoreMiddlewares.includes(Middleware.name)) {
                const instance = new Middleware();
                await instance.handle(context, async () => true, item.args);
            }
        }
        for (const item of routeMiddlewares) {
            await this.runMiddlewareItem(item, context);
        }
    }
    /**
     * Forward an error to the app's NATS exception handler. Best-effort: a
     * failure to even load the handler is logged rather than rethrown into the
     * subscription loop.
     */
    async handleException(error, context) {
        try {
            const exceptionHandler = await this.resolveExceptionHandler();
            await exceptionHandler(error, context);
        }
        catch (handlerError) {
            this.logger.error({ err: handlerError }, '[NATS] Failed to run exception handler');
        }
    }
}
exports.default = Dispatcher;
