/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Msg, MsgHdrs } from '@nats-io/nats-core'
import type { JsMsg } from '@nats-io/jetstream'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { NatsRequestContract } from '@ioc:Adonis/Addons/NatsRequest'
import { parseNatsBody, parseNatsHeaders, parseNatsParams, parseNatsQs } from '../Helpers'

export default class Request implements NatsRequestContract {
  public ctx: any
  public requestHeaders: MsgHdrs
  public requestBody: Record<string, any>
  public routeParams: Record<string, any>
  public requestQs: Record<string, any>
  public routeKey: string

  constructor(protected app: ApplicationContract, ctx: any, message: Msg | JsMsg, pattern: string) {
    this.ctx = ctx
    this.requestHeaders = parseNatsHeaders(message)
    this.requestBody = parseNatsBody(message)
    this.routeParams = parseNatsParams(message, pattern)
    this.requestQs = parseNatsQs(message)
    this.routeKey = message.subject
  }

  public async validate(model: Function | Object) {
    const { validator }: any = this.app.container.use('Adonis/Core/Validator')

    let payload: any = {}
    if (typeof model === 'function') {
      // @ts-ignore - validator class shape resolved at runtime
      const instance = new model(this.ctx)
      payload = await validator.validate({ data: this.requestBody, ...instance })
    } else if (typeof model === 'object') {
      payload = await validator.validate({ data: this.requestBody, ...model })
    }
    return payload
  }

  /**
   * Returns the request id from the `x-request-id` header. The header is
   * generated (when enabled in config) and appended if it does not exist.
   */
  public id(): string | undefined {
    let requestId = this.header('x-request-id', '')
    if (!requestId && this.ctx.config.generateRequestId) {
      const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
      requestId = `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`
      this.requestHeaders.append('x-request-id', requestId)
    }
    return requestId
  }

  /**
   * Replace the request body. `all()` is recomputed from the new body.
   */
  public updateBody(body: Record<string, any>): void {
    this.requestBody = body
  }

  /**
   * Replace the query string. `all()` is recomputed from the new query.
   */
  public updateQs(data: Record<string, any>): void {
    this.requestQs = data
  }

  /**
   * Replace the route params.
   */
  public updateParams(data: Record<string, any>): void {
    this.routeParams = data
  }

  /**
   * Bind an arbitrary value onto the request (e.g. an authenticated user).
   * Reserved keys cannot be overwritten.
   */
  public set(key: string, value: any) {
    if (!this[key]) this[key] = value
    else return new Error('This name is among the reserved names')
  }

  /**
   * Read a value previously bound with `set`.
   */
  public get(key: string) {
    return this[key]
  }

  public params(): Record<string, any> {
    return this.routeParams
  }

  public qs(): Record<string, any> {
    return this.requestQs
  }

  public body(): Record<string, any> {
    return this.requestBody
  }

  /**
   * Merged view of body, query string, and route params.
   */
  public all(): Record<string, any> {
    return { ...this.requestBody, ...this.requestQs, ...this.routeParams }
  }

  /**
   * Read a value from the merged body + query string, with optional default.
   */
  public input(key: string, defaultValue?: any) {
    const mergedData = { ...this.requestBody, ...this.requestQs }
    return typeof mergedData[key] !== 'undefined' ? mergedData[key] : defaultValue
  }

  /**
   * Read a route param, with optional default.
   */
  public param(key: string, defaultValue?: any) {
    return typeof this.routeParams[key] !== 'undefined' ? this.routeParams[key] : defaultValue
  }

  /**
   * Returns a copy of headers as a plain object.
   */
  public headers(): object {
    const data: Record<string, any> = {}
    for (const key of this.requestHeaders.keys()) {
      data[key] = this.requestHeaders.get(key)
    }
    return data
  }

  /**
   * Read a single header value, with optional default.
   */
  public header(key: string, defaultValue?: any) {
    return this.requestHeaders.has(key) ? this.requestHeaders.get(key) : defaultValue
  }
}
