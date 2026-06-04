/// <reference types="@adonisjs/logger/build/adonis-typings/logger" />
import type { LoggerContract } from '@ioc:Adonis/Core/Logger';
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker';
import type JetStream from './JetStream';
import type KeyValue from './KV';
import type ObjectStoreManager from './ObjectStore';
/**
 * One applied change in a sync run.
 */
export interface SyncEntry {
    kind: 'stream' | 'consumer' | 'kv' | 'objectStore';
    name: string;
    action: 'created' | 'updated' | 'exists';
}
/**
 * Declaratively reconcile the JetStream streams/consumers, KV buckets, and
 * Object Store buckets described in config with the server — idempotently.
 * Safe to run repeatedly (the `node ace nats:sync` command); a second run with
 * unchanged config reports everything as already present.
 */
export default class Stream {
    private config;
    private jetstream;
    private kv;
    private objectStore;
    private logger;
    constructor(config: ConfigContract, jetstream: JetStream, kv: KeyValue, objectStore: ObjectStoreManager, logger: LoggerContract);
    sync(): Promise<SyncEntry[]>;
}
