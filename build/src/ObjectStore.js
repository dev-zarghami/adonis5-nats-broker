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
const web_1 = require("node:stream/web");
const obj_1 = require("@nats-io/obj");
/**
 * Turn a byte buffer or string into a single-chunk ReadableStream, which is the
 * shape v3's ObjectStore `put` expects.
 */
function readableFrom(data) {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return new web_1.ReadableStream({
        start(controller) {
            controller.enqueue(bytes);
            controller.close();
        },
    });
}
/**
 * Drain a ReadableStream fully into a single Uint8Array.
 */
async function readAll(rs) {
    const reader = rs.getReader();
    const chunks = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            break;
        chunks.push(value);
        total += value.length;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}
/**
 * JetStream Object Store manager. `bucket(name)` returns a v3 `ObjectStore`
 * (whose native API takes/returns ReadableStreams), and `putBlob`/`getBlob`
 * provide buffer-based convenience for the common small-object case. Opened
 * buckets are cached on the shared connection.
 */
class ObjectStoreManager {
    constructor(connection) {
        this.connection = connection;
        this.buckets = new Map();
    }
    async manager() {
        if (this.objm)
            return this.objm;
        const nc = await this.connection.use();
        this.objm = new obj_1.Objm(nc);
        return this.objm;
    }
    /**
     * Open (creating if needed) an Object Store bucket, cached per name.
     */
    bucket(name, opts) {
        let existing = this.buckets.get(name);
        if (!existing) {
            existing = this.manager().then((objm) => objm.create(name, opts));
            this.buckets.set(name, existing);
        }
        return existing;
    }
    /**
     * Store a buffer/string as a named object and return its info.
     */
    async putBlob(bucket, name, data, meta = {}) {
        const store = await this.bucket(bucket);
        return store.put({ name, ...meta }, readableFrom(data));
    }
    /**
     * Retrieve a named object as a single buffer, or null if it does not exist.
     */
    async getBlob(bucket, name) {
        const store = await this.bucket(bucket);
        const result = await store.get(name);
        if (!result)
            return null;
        return readAll(result.data);
    }
    /**
     * List the status of all Object Store buckets on the server.
     */
    async list() {
        const objm = await this.manager();
        return objm.list();
    }
}
exports.default = ObjectStoreManager;
