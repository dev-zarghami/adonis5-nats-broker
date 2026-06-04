/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { ServerContract } from '@ioc:Adonis/Core/Server'
import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'

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
  constructor(
    private app: ApplicationContract,
    private server: ServerContract,
    private logger: LoggerContract,
    private config: ConfigContract
  ) {}

  /**
   * Dynamically import a `Controller.action` handler from a namespace dir and
   * return the action bound to a fresh controller instance.
   */
  public async importHandler(path: string, handler: string): Promise<Function> {
    const parts = handler.split('.')
    const file = parts.length === 2 ? parts[0] : ''
    const action = parts.length === 2 ? parts[1] : handler
    const fullPath = join(path, file)
    try {
      const { default: Handler } = await import(fullPath)
      const instance = new Handler()
      return instance[action].bind(instance)
    } catch (error) {
      this.logger.error(`[NATS] Cannot load file at path: ${fullPath}. Ensure the file exists.`)
      throw error
    }
  }

  /**
   * Resolve a controller action string against the controllers namespace.
   */
  public resolveController(controller: string): Promise<Function> {
    return this.importHandler(
      join(this.app.appRoot, this.config.namespaces.controllers),
      controller
    )
  }

  /**
   * Resolve the app's NATS exception handler `handle` method.
   */
  public resolveExceptionHandler(): Promise<Function> {
    return this.importHandler(
      join(this.app.appRoot, this.config.namespaces.exceptionHandler),
      'handle'
    )
  }

  /**
   * Run a single middleware item against the context. Supports both inline
   * function middleware (`Broker.middleware(fn)`) and resolved named/global
   * middleware classes.
   */
  private async runMiddlewareItem(item: any, context: any): Promise<void> {
    if (item.type === 'function') {
      await item.value(context, async () => true, item.args)
      return
    }
    const { default: Middleware } = await item.value()
    const instance = new Middleware()
    await instance.handle(context, async () => true, item.args)
  }

  /**
   * Run the global + route middleware stacks. Global middleware named in
   * `config.ignoreMiddlewares` (e.g. the HTTP BodyParser) are skipped.
   */
  public async runMiddleware(context: any, routeMiddlewares: any[]): Promise<void> {
    for (const item of this.server.middleware.get()) {
      const { default: Middleware } = await (item as any).value()
      if (!this.config.ignoreMiddlewares.includes(Middleware.name)) {
        const instance = new Middleware()
        await instance.handle(context, async () => true, (item as any).args)
      }
    }
    for (const item of routeMiddlewares) {
      await this.runMiddlewareItem(item, context)
    }
  }

  /**
   * Forward an error to the app's NATS exception handler. Best-effort: a
   * failure to even load the handler is logged rather than rethrown into the
   * subscription loop.
   */
  public async handleException(error: any, context: any): Promise<void> {
    try {
      const exceptionHandler = await this.resolveExceptionHandler()
      await exceptionHandler(error, context)
    } catch (handlerError) {
      this.logger.error({ err: handlerError }, '[NATS] Failed to run exception handler')
    }
  }
}
