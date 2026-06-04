/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type RouteGroup from './RouteGroup'

/**
 * A single registered core route. Holds raw middleware specs (names, arrays, or
 * inline functions) which the `Router` resolves and composes with any enclosing
 * group(s) at startup.
 */
export default class Route {
  /**
   * Raw middleware specs attached directly to this route, seeded with whatever
   * stateful `Broker.middleware()` stack was active when the route was defined.
   */
  public ownMiddleware: any[]

  constructor(
    public pattern: string,
    public handler: string,
    public parent: RouteGroup | null,
    baseMiddleware: any[] = []
  ) {
    this.ownMiddleware = [...baseMiddleware]
  }

  /**
   * Attach middleware to just this route. Accepts a named middleware string
   * (e.g. `'auth'` or `'auth:web,api'`), an array of them, or an inline
   * function. Chainable.
   */
  public middleware(middleware: string | string[] | Function): this {
    this.ownMiddleware.push(middleware)
    return this
  }
}
