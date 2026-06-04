declare module '@ioc:Adonis/Addons/NatsObjectStore' {
    import type { ObjectInfo, ObjectStore as ObjStore, ObjectStoreOptions, ObjectStoreStatus } from '@nats-io/obj';
    import type { Lister } from '@nats-io/jetstream';
    export interface NatsObjectStoreContract {
        /**
         * Open (creating if needed) an Object Store bucket. The returned bucket
         * exposes the native streaming `ObjectStore` API. Buckets are cached per
         * name.
         */
        bucket(name: string, opts?: Partial<ObjectStoreOptions>): Promise<ObjStore>;
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
    const ObjectStore: NatsObjectStoreContract;
    export default ObjectStore;
}
