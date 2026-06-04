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
 * A group of routes (and/or nested groups) sharing a subject prefix and a
 * middleware stack. Created by `Broker.group(callback)`; the prefix and
 * middleware can be set fluently after the callback, AdonisJS-style:
 *
 *   Broker.group(() => {
 *     Broker.route('get.users', 'UsersController.index')
 *   }).prefix('admin').middleware('auth')
 */
class RouteGroup {
    constructor(parent) {
        this.parent = parent;
        this.ownMiddleware = [];
        this.groupPrefix = '';
        this.children = [];
    }
    /**
     * Apply middleware to every route in the group (and nested groups). Accepts a
     * named middleware string, an array of them, or an inline function. Chainable.
     */
    middleware(middleware) {
        this.ownMiddleware.push(middleware);
        return this;
    }
    /**
     * Prepend a subject prefix to every route in the group. Chainable.
     */
    prefix(prefix) {
        this.groupPrefix = prefix;
        return this;
    }
}
exports.default = RouteGroup;
