import type RouteGroup from './RouteGroup';
/**
 * A single registered core route. Holds raw middleware specs (names, arrays, or
 * inline functions) which the `Router` resolves and composes with any enclosing
 * group(s) at startup.
 */
export default class Route {
    pattern: string;
    handler: string;
    parent: RouteGroup | null;
    /**
     * Raw middleware specs attached directly to this route, seeded with whatever
     * stateful `Broker.middleware()` stack was active when the route was defined.
     */
    ownMiddleware: any[];
    constructor(pattern: string, handler: string, parent: RouteGroup | null, baseMiddleware?: any[]);
    /**
     * Attach middleware to just this route. Accepts a named middleware string
     * (e.g. `'auth'` or `'auth:web,api'`), an array of them, or an inline
     * function. Chainable.
     */
    middleware(middleware: string | string[] | Function): this;
}
