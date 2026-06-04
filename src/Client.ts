/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { connect } from '@nats-io/transport-node'
import type { NatsConnection } from '@nats-io/nats-core'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'
import type { NatsRequestOptions, NatsRequestResponse } from '@ioc:Adonis/Addons/NatsRequest'
import type Connection from './Connection'
import { buildHeaders, headersToObject, prefixPattern } from './Helpers'

/**
 * Outbound NATS client: `request()` (request/reply) and `publish()`
 * (fire-and-forget). Unlike v1 — which opened and closed a fresh connection on
 * every call — both reuse the single shared connection. A request may still
 * target a different server by passing `options.servers`, in which case a
 * dedicated short-lived connection is opened just for that call.
 */
export default class Client {
  constructor(
    private app: ApplicationContract,
    private config: ConfigContract,
    private connection: Connection
  ) {}

  private validatorSchema() {
    const { schema } = this.app.container.use('Adonis/Core/Validator')
    return schema.create({
      timeout: schema.number.optional(),
      qs: schema.object.optional().anyMembers(),
      body: schema.object().anyMembers(),
      headers: schema.object.optional().anyMembers(),
      servers: schema.string.optional(),
    })
  }

  private async validate(body: any, options: NatsRequestOptions) {
    const { validator }: any = this.app.container.use('Adonis/Core/Validator')
    return validator.validate({
      data: Object.assign({ body }, options),
      schema: this.validatorSchema(),
    })
  }

  /**
   * Send a request and await the reply. Always resolves with the response —
   * inspect `response.headers.status` to handle non-2xx replies.
   */
  public async request(
    pattern: string,
    body: object = {},
    options: NatsRequestOptions = {}
  ): Promise<NatsRequestResponse> {
    const mixedPattern = prefixPattern(this.config.core.request.prefix, pattern)
    const payload: any = await this.validate(body, options)

    const mixedHeaders = Object.assign({}, this.config.core.request.headers, payload.headers)
    const hdrs = buildHeaders(mixedHeaders)
    const Payload = JSON.stringify({
      body: payload.body || {},
      qs: Object.assign({}, this.config.core.request.qs, payload.qs),
    })
    const timeout = payload.timeout || this.config.core.request.timeout

    // Reuse the shared connection unless a one-off server target was requested.
    const dedicated: NatsConnection | undefined = payload.servers
      ? await connect({ servers: payload.servers, name: this.config.connection.name })
      : undefined
    const connection: NatsConnection = dedicated || (await this.connection.use())

    try {
      const response = await connection.request(mixedPattern, Payload, { timeout, headers: hdrs })
      const responseHeaders = headersToObject(response.headers) as { status: number } & Record<
        string,
        any
      >
      responseHeaders.status = Number(responseHeaders.status)

      const decoded = response.string()
      let parsedData: any
      try {
        parsedData = JSON.parse(decoded)
      } catch {
        parsedData = decoded
      }

      return {
        headers: responseHeaders,
        body: parsedData,
        request: {
          servers: payload.servers || this.config.connection.servers,
          timeout,
          payload: JSON.parse(Payload),
          headers: mixedHeaders,
          name: this.config.connection.name as string,
          url: mixedPattern,
        },
      }
    } finally {
      if (dedicated) await dedicated.close()
    }
  }

  /**
   * Publish a message without waiting for a reply.
   */
  public async publish(
    pattern: string,
    body: object = {},
    options: NatsRequestOptions = {}
  ): Promise<Boolean | Error> {
    const mixedPattern = prefixPattern(this.config.core.publish.prefix, pattern)
    const payload: any = await this.validate(body, options)

    const mixedHeaders = Object.assign({}, this.config.core.publish.headers, payload.headers)
    const hdrs = buildHeaders(mixedHeaders)
    const Payload = JSON.stringify({
      body: payload.body || {},
      qs: Object.assign({}, this.config.core.publish.qs, payload.qs),
    })

    const connection = await this.connection.use()
    connection.publish(mixedPattern, Payload, { headers: hdrs })
    await connection.flush()
    return true
  }
}
