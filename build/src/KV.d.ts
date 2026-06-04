import type { KV, KvOptions, KvStatus } from '@nats-io/kv';
import type { Lister } from '@nats-io/jetstream';
import type { NatsKVContract } from '@ioc:Adonis/Addons/NatsKV';
import type Connection from './Connection';
/**
 * JetStream Key-Value manager. `bucket(name)` returns a v3 `KV` instance whose
 * own API (`put`, `get`, `watch`, `delete`, `keys`, ...) is exposed directly —
 * entries provide `string()`/`json()` convenience. Opened buckets are cached so
 * repeated lookups reuse the same handle on the shared connection.
 */
export default class KeyValue implements NatsKVContract {
    private connection;
    private kvm?;
    private readonly buckets;
    constructor(connection: Connection);
    private manager;
    /**
     * Open (creating if needed) a KV bucket. The returned `KV` is cached per name.
     */
    bucket(name: string, opts?: Partial<KvOptions>): Promise<KV>;
    /**
     * List the status of all KV buckets on the server.
     */
    list(): Promise<Lister<KvStatus>>;
}
