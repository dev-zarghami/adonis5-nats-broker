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
/**
 * A single registered core route. Holds raw middleware specs (names, arrays, or
 * inline functions) which the `Router` resolves and composes with any enclosing
 * group(s) at startup.
 */
class Route {
    constructor(pattern, handler, parent, baseMiddleware = []) {
        this.pattern = pattern;
        this.handler = handler;
        this.parent = parent;
        this.ownMiddleware = [...baseMiddleware];
    }
    /**
     * Attach middleware to just this route. Accepts a named middleware string
     * (e.g. `'auth'` or `'auth:web,api'`), an array of them, or an inline
     * function. Chainable.
     */
    middleware(middleware) {
        this.ownMiddleware.push(middleware);
        return this;
    }
}
exports.default = Route;
