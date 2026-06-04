import type { ObjectInfo, ObjectStore, ObjectStoreOptions, ObjectStoreStatus } from '@nats-io/obj';
import type { Lister } from '@nats-io/jetstream';
import type { NatsObjectStoreContract } from '@ioc:Adonis/Addons/NatsObjectStore';
import type Connection from './Connection';
/**
 * JetStream Object Store manager. `bucket(name)` returns a v3 `ObjectStore`
 * (whose native API takes/returns ReadableStreams), and `putBlob`/`getBlob`
 * provide buffer-based convenience for the common small-object case. Opened
 * buckets are cached on the shared connection.
 */
export default class ObjectStoreManager implements NatsObjectStoreContract {
    private connection;
    private objm?;
    private readonly buckets;
    constructor(connection: Connection);
    private manager;
    /**
     * Open (creating if needed) an Object Store bucket, cached per name.
     */
    bucket(name: string, opts?: Partial<ObjectStoreOptions>): Promise<ObjectStore>;
    /**
     * Store a buffer/string as a named object and return its info.
     */
    putBlob(bucket: string, name: string, data: Uint8Array | string, meta?: {
        description?: string;
    }): Promise<ObjectInfo>;
    /**
     * Retrieve a named object as a single buffer, or null if it does not exist.
     */
    getBlob(bucket: string, name: string): Promise<Uint8Array | null>;
    /**
     * List the status of all Object Store buckets on the server.
     */
    list(): Promise<Lister<ObjectStoreStatus>>;
}
