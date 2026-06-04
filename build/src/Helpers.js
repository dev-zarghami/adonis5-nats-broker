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
exports.headersToObject = exports.buildHeaders = exports.prefixPattern = exports.createSubject = exports.parseNatsParams = exports.parseNatsBody = exports.parseNatsQs = exports.parseNatsHeaders = void 0;
const nats_core_1 = require("@nats-io/nats-core");
const qs_1 = require("qs");
/**
 * Safely decode the JSON envelope (`{ body, qs }`) carried in the message
 * payload. Returns an empty object when the payload is absent or malformed.
 */
function decodeEnvelope(message) {
    try {
        if (!message.data || message.data.length === 0)
            return {};
        const parsed = JSON.parse(message.string());
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
}
function parseNatsHeaders(message) {
    return message.headers || (0, nats_core_1.headers)();
}
exports.parseNatsHeaders = parseNatsHeaders;
function parseNatsQs(message) {
    const { qs } = decodeEnvelope(message);
    if (qs && typeof qs === 'object')
        return qs;
    if (typeof qs === 'string')
        return (0, qs_1.parse)(qs);
    return {};
}
exports.parseNatsQs = parseNatsQs;
function parseNatsBody(message) {
    const { body } = decodeEnvelope(message);
    return body && typeof body === 'object' ? body : {};
}
exports.parseNatsBody = parseNatsBody;
/**
 * Map the wildcard segments of an incoming subject back onto the named
 * params declared in the route pattern (e.g. `get.users.{id}`).
 *
 * Iterates by index rather than `Array.indexOf`, so patterns with repeated
 * segments (e.g. `get.x.{a}.x.{b}`) resolve each param to the correct token.
 */
function parseNatsParams(message, pattern) {
    const patternKeys = pattern.split('.');
    const subjectKeys = message.subject.split('?')[0].split('.');
    const params = {};
    patternKeys.forEach((item, index) => {
        if (item.startsWith('{') && item.endsWith('}')) {
            const key = item.slice(1, -1);
            params[key] = subjectKeys[index];
        }
    });
    return params;
}
exports.parseNatsParams = parseNatsParams;
/**
 * Convert a route pattern into a NATS subscription subject by replacing
 * named params (`{id}`) with single-token wildcards (`*`).
 */
function createSubject(pattern) {
    return pattern
        .split('.')
        .map((item) => (item.startsWith('{') ? '*' : item))
        .join('.');
}
exports.createSubject = createSubject;
/**
 * Concatenate a configured prefix with a pattern, dropping empty segments.
 * Shared by routes, requests, publishes, and JetStream subjects.
 */
function prefixPattern(prefix, pattern) {
    return prefix
        .split('.')
        .concat(pattern.split('.'))
        .filter((item) => item.length)
        .join('.');
}
exports.prefixPattern = prefixPattern;
/**
 * Build a `MsgHdrs` from a plain object, JSON-encoding object values so they
 * survive the string-only NATS header transport.
 */
function buildHeaders(source = {}) {
    const hdrs = (0, nats_core_1.headers)();
    for (const field of Object.keys(source)) {
        const value = source[field];
        hdrs.append(field, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    return hdrs;
}
exports.buildHeaders = buildHeaders;
/**
 * Flatten a `MsgHdrs` into a plain object (first value per key).
 */
function headersToObject(hdrs) {
    const out = {};
    if (!hdrs)
        return out;
    for (const key of hdrs.keys()) {
        out[key] = hdrs.get(key);
    }
    return out;
}
exports.headersToObject = headersToObject;
