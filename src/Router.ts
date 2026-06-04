/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Subscription } from '@nats-io/nats-core'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { ServerContract } from '@ioc:Adonis/Core/Server'
import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'
import type Connection from './Connection'
import type Dispatcher from './Dispatcher'
import Route from './Route'
import RouteGroup from './RouteGroup'
import Request from './Context/Request'
import Response from './Context/Response'
import { createSubject, parseNatsParams } from './Helpers'

/**
 * A route flattened from the tree, ready to subscribe: composed subject
 * pattern, resolved middleware stack, and controller action.
 */
interface ResolvedRoute {
  pattern: string
  middlewares: any[]
  controller: string
}

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
  private activeMiddleware: any[] = []
  private currentGroup: RouteGroup | null = null
  private readonly tree: (Route | RouteGroup)[] = []

  constructor(
    private app: ApplicationContract,
    private server: ServerContract,
    private logger: LoggerContract,
    private config: ConfigContract,
    private connection: Connection,
    private dispatcher: Dispatcher
  ) {}

  /**
   * Set (or clear) the stateful middleware stack applied to every subsequent
   * `route()` call. Call with no args to clear. Accepts named middleware
   * (`'auth:web,api'`), arrays, or inline functions.
   */
  public middleware(middleware?: any): this {
    this.activeMiddleware = middleware
      ? Array.isArray(middleware)
        ? middleware
        : [middleware]
      : []
    return this
  }

  /**
   * Register a route, seeded with the active stateful middleware stack. Returns
   * the `Route` so middleware can be chained: `route(...).middleware('auth')`.
   */
  public route(pattern: string, handler: string): Route {
    const route = new Route(pattern, handler, this.currentGroup, this.activeMiddleware)
    this.attach(route)
    return route
  }

  /**
   * Group routes (and nested groups) under a shared prefix/middleware stack.
   * Routes declared inside `callback` belong to the group; set the group's
   * prefix/middleware fluently on the returned `RouteGroup`.
   */
  public group(callback: () => void): RouteGroup {
    const group = new RouteGroup(this.currentGroup)
    const parent = this.currentGroup
    this.currentGroup = group
    try {
      callback()
    } finally {
      this.currentGroup = parent
    }
    this.attach(group)
    return group
  }

  private attach(node: Route | RouteGroup): void {
    if (this.currentGroup) this.currentGroup.children.push(node)
    else this.tree.push(node)
  }

  /**
   * Subscribe every registered route on the shared connection and begin
   * consuming. Called once the connection is ready (server run mode).
   */
  public async start(): Promise<void> {
    const connection = await this.connection.use()
    for (const resolved of this.resolveRoutes()) {
      const subject = createSubject(resolved.pattern)
      const subscription = connection.subscribe(subject, this.config.core.routes.options)
      this.consume(subscription, resolved).catch((error) =>
        this.logger.error({ err: error }, `[NATS] subscription loop crashed for ${subject}`)
      )
      this.logMapped(resolved)
    }
  }

  /**
   * Flatten the route/group tree into concrete routes, composing each route's
   * subject prefix and middleware stack from its enclosing groups.
   */
  private resolveRoutes(): ResolvedRoute[] {
    const out: ResolvedRoute[] = []
    const walk = (node: Route | RouteGroup, prefixes: string[], middleware: any[]) => {
      if (node instanceof RouteGroup) {
        const nextPrefixes = node.groupPrefix ? [...prefixes, node.groupPrefix] : prefixes
        const nextMiddleware = [...middleware, ...node.ownMiddleware]
        for (const child of node.children) walk(child, nextPrefixes, nextMiddleware)
        return
      }
      const parts = [this.config.core.routes.prefix, ...prefixes, node.pattern]
      out.push({
        pattern: parts.filter((part) => part && part.length).join('.'),
        middlewares: this.resolveMiddleware([...middleware, ...node.ownMiddleware]),
        controller: node.handler,
      })
    }
    for (const node of this.tree) walk(node, [], [])
    return out
  }

  /**
   * Resolve raw middleware specs (names / arrays / functions) into runnable
   * middleware items, preserving order.
   */
  private resolveMiddleware(specs: any[]): any[] {
    const items: any[] = []
    for (const spec of specs) {
      for (const mid of Array.isArray(spec) ? spec : [spec]) {
        if (typeof mid === 'function') {
          items.push({ type: 'function', value: mid, args: [] })
          continue
        }
        const name = mid.split(':')[0]
        const named: any = this.server.middleware.getNamed(name)
        if (named) {
          named.args = mid.split(':').length === 2 ? mid.split(':')[1].split('.') : []
          items.push(named)
        } else {
          this.logger.error(`[NATS] cannot find ${name} middleware`)
        }
      }
    }
    return items
  }

  private async consume(subscription: Subscription, route: ResolvedRoute): Promise<void> {
    const Controller = await this.dispatcher.resolveController(route.controller)
    for await (const msg of subscription) {
      const context: any = {
        config: this.config,
        params: parseNatsParams(msg, route.pattern),
        logger: this.logger,
        routeKey: msg.subject,
      }
      try {
        context.response = new Response((response) =>
          msg.respond(response.body, { headers: response.headers })
        )
        context.request = new Request(this.app, context, msg, route.pattern)
        await this.dispatcher.runMiddleware(context, route.middlewares)
        await Controller(context)
      } catch (error) {
        await this.dispatcher.handleException(error, context)
      }
    }
  }

  private logMapped(route: ResolvedRoute): void {
    const names = route.middlewares.length
      ? ` Middlewares: [${route.middlewares
          .map((m) =>
            m.type === 'function' ? m.value.name || 'fn' : m.value?.name || m.name || ''
          )
          .join(', ')}]`
      : ''
    this.logger.info(`[NATS] RouteExplorer mapped { ${route.pattern} }${names}`)
  }
}
