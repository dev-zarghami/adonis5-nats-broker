import type { Msg, MsgHdrs } from '@nats-io/nats-core';
import type { JsMsg } from '@nats-io/jetstream';
/**
 * A NATS message we can read from. Both a core `Msg` and a JetStream `JsMsg`
 * expose the same read surface (`subject`, `data`, `headers`, `string()`).
 */
type ReadableMessage = Msg | JsMsg;
export declare function parseNatsHeaders(message: ReadableMessage): MsgHdrs;
export declare function parseNatsQs(message: ReadableMessage): Record<string, any>;
export declare function parseNatsBody(message: ReadableMessage): Record<string, any>;
/**
 * Map the wildcard segments of an incoming subject back onto the named
 * params declared in the route pattern (e.g. `get.users.{id}`).
 *
 * Iterates by index rather than `Array.indexOf`, so patterns with repeated
 * segments (e.g. `get.x.{a}.x.{b}`) resolve each param to the correct token.
 */
export declare function parseNatsParams(message: ReadableMessage, pattern: string): Record<string, any>;
/**
 * Convert a route pattern into a NATS subscription subject by replacing
 * named params (`{id}`) with single-token wildcards (`*`).
 */
export declare function createSubject(pattern: string): string;
/**
 * Concatenate a configured prefix with a pattern, dropping empty segments.
 * Shared by routes, requests, publishes, and JetStream subjects.
 */
export declare function prefixPattern(prefix: string, pattern: string): string;
/**
 * Build a `MsgHdrs` from a plain object, JSON-encoding object values so they
 * survive the string-only NATS header transport.
 */
export declare function buildHeaders(source?: Record<string, any>): MsgHdrs;
/**
 * Flatten a `MsgHdrs` into a plain object (first value per key).
 */
export declare function headersToObject(hdrs?: MsgHdrs): Record<string, any>;
export {};
