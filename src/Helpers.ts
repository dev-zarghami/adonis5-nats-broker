/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { headers } from '@nats-io/nats-core'
import { parse } from 'qs'
import type { Msg, MsgHdrs } from '@nats-io/nats-core'
import type { JsMsg } from '@nats-io/jetstream'

/**
 * A NATS message we can read from. Both a core `Msg` and a JetStream `JsMsg`
 * expose the same read surface (`subject`, `data`, `headers`, `string()`).
 */
type ReadableMessage = Msg | JsMsg

/**
 * Safely decode the JSON envelope (`{ body, qs }`) carried in the message
 * payload. Returns an empty object when the payload is absent or malformed.
 */
function decodeEnvelope(message: ReadableMessage): Record<string, any> {
  try {
    if (!message.data || message.data.length === 0) return {}
    const parsed = JSON.parse(message.string())
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function parseNatsHeaders(message: ReadableMessage): MsgHdrs {
  return message.headers || headers()
}

export function parseNatsQs(message: ReadableMessage): Record<string, any> {
  const { qs } = decodeEnvelope(message)
  if (qs && typeof qs === 'object') return qs
  if (typeof qs === 'string') return parse(qs)
  return {}
}

export function parseNatsBody(message: ReadableMessage): Record<string, any> {
  const { body } = decodeEnvelope(message)
  return body && typeof body === 'object' ? body : {}
}

/**
 * Map the wildcard segments of an incoming subject back onto the named
 * params declared in the route pattern (e.g. `get.users.{id}`).
 *
 * Iterates by index rather than `Array.indexOf`, so patterns with repeated
 * segments (e.g. `get.x.{a}.x.{b}`) resolve each param to the correct token.
 */
export function parseNatsParams(message: ReadableMessage, pattern: string): Record<string, any> {
  const patternKeys = pattern.split('.')
  const subjectKeys = message.subject.split('?')[0].split('.')
  const params: Record<string, any> = {}
  patternKeys.forEach((item, index) => {
    if (item.startsWith('{') && item.endsWith('}')) {
      const key = item.slice(1, -1)
      params[key] = subjectKeys[index]
    }
  })
  return params
}

/**
 * Convert a route pattern into a NATS subscription subject by replacing
 * named params (`{id}`) with single-token wildcards (`*`).
 */
export function createSubject(pattern: string): string {
  return pattern
    .split('.')
    .map((item) => (item.startsWith('{') ? '*' : item))
    .join('.')
}

/**
 * Concatenate a configured prefix with a pattern, dropping empty segments.
 * Shared by routes, requests, publishes, and JetStream subjects.
 */
export function prefixPattern(prefix: string, pattern: string): string {
  return prefix
    .split('.')
    .concat(pattern.split('.'))
    .filter((item) => item.length)
    .join('.')
}

/**
 * Build a `MsgHdrs` from a plain object, JSON-encoding object values so they
 * survive the string-only NATS header transport.
 */
export function buildHeaders(source: Record<string, any> = {}): MsgHdrs {
  const hdrs = headers()
  for (const field of Object.keys(source)) {
    const value = source[field]
    hdrs.append(field, typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  return hdrs
}

/**
 * Flatten a `MsgHdrs` into a plain object (first value per key).
 */
export function headersToObject(hdrs?: MsgHdrs): Record<string, any> {
  const out: Record<string, any> = {}
  if (!hdrs) return out
  for (const key of hdrs.keys()) {
    out[key] = hdrs.get(key)
  }
  return out
}
