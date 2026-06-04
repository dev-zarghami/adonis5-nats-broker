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
const kv_1 = require("@nats-io/kv");
/**
 * JetStream Key-Value manager. `bucket(name)` returns a v3 `KV` instance whose
 * own API (`put`, `get`, `watch`, `delete`, `keys`, ...) is exposed directly —
 * entries provide `string()`/`json()` convenience. Opened buckets are cached so
 * repeated lookups reuse the same handle on the shared connection.
 */
class KeyValue {
    constructor(connection) {
        this.connection = connection;
        this.buckets = new Map();
    }
    async manager() {
        if (this.kvm)
            return this.kvm;
        const nc = await this.connection.use();
        this.kvm = new kv_1.Kvm(nc);
        return this.kvm;
    }
    /**
     * Open (creating if needed) a KV bucket. The returned `KV` is cached per name.
     */
    bucket(name, opts) {
        let existing = this.buckets.get(name);
        if (!existing) {
            existing = this.manager().then((kvm) => kvm.create(name, opts));
            this.buckets.set(name, existing);
        }
        return existing;
    }
    /**
     * List the status of all KV buckets on the server.
     */
    async list() {
        const kvm = await this.manager();
        return kvm.list();
    }
}
exports.default = KeyValue;
