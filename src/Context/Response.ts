/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { headers as natsHeaders } from '@nats-io/nats-core'
import type { MsgHdrs } from '@nats-io/nats-core'
import type { NatsResponseContract } from '@ioc:Adonis/Addons/NatsResponse'

/**
 * The callback that actually delivers the buffered response over NATS. For a
 * core request/reply route this calls `msg.respond(...)`; for a JetStream
 * consumer with no reply subject it is a no-op.
 */
export type ResponderCallback = (response: { body: string; headers: MsgHdrs }) => void

export default class Response implements NatsResponseContract {
  private statusCode: number
  private readonly headers: MsgHdrs
  private body: any

  constructor(protected callback: ResponderCallback) {
    this.statusCode = 200
    this.headers = natsHeaders()
    this.body = {}
  }

  /**
   * Returns the existing value for a given response header.
   */
  getHeader(key: string) {
    return this.headers.get(key.toLowerCase())
  }

  /**
   * Get the response headers object.
   */
  getHeaders() {
    return this.headers as any
  }

  /**
   * Append a header value. Falsy values are ignored.
   */
  header(key: string, value: any) {
    if (value) this.headers.append(key.toLowerCase(), String(value))
    return this
  }

  /**
   * Returns the status code currently set on the response.
   */
  getStatus(): number {
    return this.statusCode
  }

  /**
   * Set the response status code. Travels in the `status` header, not the body.
   */
  status(code: number) {
    this.statusCode = code
    return this
  }

  /**
   * Buffer and send the body. The status is appended as a `status` header and
   * the body is JSON-encoded; v3 accepts a string payload directly.
   */
  send(body: any) {
    this.body = body
    this.headers.append('status', String(this.statusCode))
    return this.callback({
      body: JSON.stringify(this.body),
      headers: this.headers,
    })
  }

  continue() {
    this.status(100)
    return this.send(null)
  }

  switchingProtocols() {
    this.status(101)
    return this.send(null)
  }

  ok(body: any) {
    this.status(200)
    return this.send(body)
  }

  created(body?: any) {
    this.status(201)
    return this.send(body)
  }

  accepted(body: any) {
    this.status(202)
    return this.send(body)
  }

  nonAuthoritativeInformation(body: any) {
    this.status(203)
    return this.send(body)
  }

  noContent() {
    this.status(204)
    return this.send(null)
  }

  resetContent() {
    this.status(205)
    return this.send(null)
  }

  partialContent(body: any) {
    this.status(206)
    return this.send(body)
  }

  multipleChoices(body?: any) {
    this.status(300)
    return this.send(body)
  }

  movedPermanently(body?: any) {
    this.status(301)
    return this.send(body)
  }

  movedTemporarily(body?: any) {
    this.status(302)
    return this.send(body)
  }

  seeOther(body?: any) {
    this.status(303)
    return this.send(body)
  }

  notModified(body?: any) {
    this.status(304)
    return this.send(body)
  }

  useProxy(body?: any) {
    this.status(305)
    return this.send(body)
  }

  temporaryRedirect(body?: any) {
    this.status(307)
    return this.send(body)
  }

  badRequest(body?: any) {
    this.status(400)
    return this.send(body)
  }

  unauthorized(body?: any) {
    this.status(401)
    return this.send(body)
  }

  paymentRequired(body?: any) {
    this.status(402)
    return this.send(body)
  }

  forbidden(body?: any) {
    this.status(403)
    return this.send(body)
  }

  notFound(body?: any) {
    this.status(404)
    return this.send(body)
  }

  methodNotAllowed(body?: any) {
    this.status(405)
    return this.send(body)
  }

  notAcceptable(body?: any) {
    this.status(406)
    return this.send(body)
  }

  proxyAuthenticationRequired(body?: any) {
    this.status(407)
    return this.send(body)
  }

  requestTimeout(body?: any) {
    this.status(408)
    return this.send(body)
  }

  conflict(body?: any) {
    this.status(409)
    return this.send(body)
  }

  gone(body?: any) {
    this.status(410)
    return this.send(body)
  }

  lengthRequired(body?: any) {
    this.status(411)
    return this.send(body)
  }

  preconditionFailed(body?: any) {
    this.status(412)
    return this.send(body)
  }

  requestEntityTooLarge(body?: any) {
    this.status(413)
    return this.send(body)
  }

  requestUriTooLong(body?: any) {
    this.status(414)
    return this.send(body)
  }

  unsupportedMediaType(body?: any) {
    this.status(415)
    return this.send(body)
  }

  requestedRangeNotSatisfiable(body?: any) {
    this.status(416)
    return this.send(body)
  }

  expectationFailed(body?: any) {
    this.status(417)
    return this.send(body)
  }

  unprocessableEntity(body?: any) {
    this.status(422)
    return this.send(body)
  }

  tooManyRequests(body?: any) {
    this.status(429)
    return this.send(body)
  }

  internalServerError(body?: any) {
    this.status(500)
    return this.send(body)
  }

  notImplemented(body?: any) {
    this.status(501)
    return this.send(body)
  }

  badGateway(body?: any) {
    this.status(502)
    return this.send(body)
  }

  serviceUnavailable(body?: any) {
    this.status(503)
    return this.send(body)
  }

  gatewayTimeout(body?: any) {
    this.status(504)
    return this.send(body)
  }

  httpVersionNotSupported(body?: any) {
    this.status(505)
    return this.send(body)
  }
}
