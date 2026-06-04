import type Route from './Route';
/**
 * A group of routes (and/or nested groups) sharing a subject prefix and a
 * middleware stack. Created by `Broker.group(callback)`; the prefix and
 * middleware can be set fluently after the callback, AdonisJS-style:
 *
 *   Broker.group(() => {
 *     Broker.route('get.users', 'UsersController.index')
 *   }).prefix('admin').middleware('auth')
 */
export default class RouteGroup {
    parent: RouteGroup | null;
    ownMiddleware: any[];
    groupPrefix: string;
    children: (Route | RouteGroup)[];
    constructor(parent: RouteGroup | null);
    /**
     * Apply middleware to every route in the group (and nested groups). Accepts a
     * named middleware string, an array of them, or an inline function. Chainable.
     */
    middleware(middleware: string | string[] | Function): this;
    /**
     * Prepend a subject prefix to every route in the group. Chainable.
     */
    prefix(prefix: string): this;
}
